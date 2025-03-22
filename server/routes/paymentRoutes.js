// server/routes/paymentRoutes.js
require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Import du modèle de connexion DB unifié
const dbConnect = require("../utils/dbConnect");
const User = require("../models/User");
const Ticket = require("../models/ticket");
const { sendTicketEmail } = require("../utils/emailService");
const { generateTicketPDF } = require("../utils/generateTicket");

console.log("✅ paymentRoutes chargé");

// Vérifier que les dossiers nécessaires existent
const dirs = [
  path.join(__dirname, '..', 'tickets'),
  path.join(__dirname, '..', 'qrcodes')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Dossier créé: ${dir}`);
  }
});

// ----------------------------------------------------
// Route GET de test
// ----------------------------------------------------
router.get("/", (req, res) => {
  console.log("✅ GET /api/payment");
  res.send("✅ API Stripe Payment OK");
});

// Route de test pour l'envoi d'email
router.get("/test-email", async (req, res) => {
  try {
    console.log("📧 Test d'envoi d'email démarré");
    const nodemailer = require("nodemailer");
    
    // Vérifiez que les variables d'environnement sont définies
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Variables EMAIL_USER ou EMAIL_PASS non définies");
    }
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      debug: true
    });
    
    // Vérifier la connexion au service d'email
    await transporter.verify();
    console.log("✅ Connexion au service d'email établie");
    
    // Envoi d'un email simple
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Envoi à soi-même pour le test
      subject: "Test email Tropitech",
      text: "Ceci est un test pour vérifier que l'envoi d'email fonctionne correctement.",
      html: "<p>Ceci est un test pour vérifier que l'envoi d'email <b>fonctionne correctement</b>.</p>"
    });
    
    console.log("✅ Email de test envoyé:", info.messageId);
    res.send(`Email de test envoyé avec succès! ID: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Erreur lors du test d'email:", error);
    res.status(500).send(`Erreur de test email: ${error.message}`);
  }
});

// ----------------------------------------------------
// ROUTE : POST /create-payment
// Crée un PaymentIntent + enregistre un utilisateur en BDD
// ----------------------------------------------------
router.post("/create-payment", async (req, res) => {
  try {
    // Connecter à la DB si pas déjà connecté
    await dbConnect();
    
    console.log("✅ POST /api/payment/create-payment appelé !");
    console.log("Body reçu:", req.body);

    const { amount, email, name, firstName, imageConsent } = req.body;

    // Validation des données d'entrée
    if (!amount || !email || !name || !firstName) {
      return res.status(400).json({ 
        error: "Données incomplètes",
        details: "Tous les champs (amount, email, name, firstName) sont requis" 
      });
    }

    // Vérification de base
    if (!imageConsent) {
      console.log("❌ L'utilisateur n'a pas coché le droit à l'image.");
      return res.status(400).json({ error: "Vous devez accepter le droit à l'image" });
    }

    // 1) Créer le PaymentIntent sur Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "chf",
      receipt_email: email,
      metadata: {
        customer_name: name,
        customer_firstName: firstName,
        customer_email: email
      }
    });
    console.log("✅ PaymentIntent créé :", paymentIntent.id);

    // 2) Créer l'utilisateur associé (pour rattacher le paymentId)
    const user = new User({
      email,
      name,
      firstName,
      paymentId: paymentIntent.id,
      imageConsent,
    });

    // Sauvegarde en base
    await user.save();
    console.log("✅ Utilisateur sauvegardé en base avec paymentId:", paymentIntent.id);

    // 3) Répondre au front-end avec le client_secret pour finaliser le paiement
    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("❌ Erreur création paiement:", error);
    return res.status(500).json({ 
      error: "Erreur lors de la création du paiement",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ----------------------------------------------------
// ROUTE : POST /webhook
// Stripe envoie les événements (payment_intent.succeeded, etc.)
// ----------------------------------------------------
// IMPORTANT: Cette route doit être définie AVANT express.json() middleware dans server.js
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  console.log("📩 Webhook Stripe reçu !");

  try {
    // Récupérer le corps de la requête en tant que Buffer
    const payload = req.body;
    const sig = req.headers['stripe-signature'];
    let event;

    // SECURITY FIX: En production, on exige toujours la vérification de la signature
    if (process.env.NODE_ENV === 'production' && (!process.env.STRIPE_WEBHOOK_SECRET || !sig)) {
      console.error('❌ Webhook error: Signature verification required in production');
      return res.status(403).send('Webhook signature verification failed');
    }

    // Vérifier la signature
    try {
      if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
        event = stripe.webhooks.constructEvent(
          payload, 
          sig, 
          process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log(`✅ Signature Stripe vérifiée`);
      } else if (process.env.NODE_ENV !== 'production') {
        // En développement uniquement, on peut accepter sans signature
        event = JSON.parse(payload.toString());
        console.log(`⚠️ Webhook sans vérification de signature (développement uniquement)`);
      } else {
        throw new Error('Impossible de vérifier la signature du webhook');
      }
    } catch (signatureError) {
      console.error(`❌ Erreur de signature webhook: ${signatureError.message}`);
      return res.status(400).send(`Webhook Signature Error: ${signatureError.message}`);
    }

    console.log(`✅ Type d'événement: ${event.type}`);

    // Traitement de l'événement payment_intent.succeeded
    if (event.type === "payment_intent.succeeded") {
      await handlePaymentIntentSucceeded(event.data.object);
      return res.status(200).send('Webhook handled: payment_intent.succeeded');
    } 
    // Traitement de l'événement payment_intent.payment_failed
    else if (event.type === "payment_intent.payment_failed") {
      await handlePaymentIntentFailed(event.data.object);
      return res.status(200).send('Webhook handled: payment_intent.payment_failed');
    } 
    // Autres événements
    else {
      console.log(`ℹ️ Événement non traité: ${event.type}`);
      return res.status(200).send(`Webhook received: ${event.type}`);
    }
  } catch (error) {
    console.error(`❌ Erreur globale webhook: ${error.message}`);
    console.error(error.stack);
    return res.status(500).send(`Webhook Error: ${error.message}`);
  }
});

/**
 * Gestion d'un paiement réussi
 * @param {Object} paymentIntent - Objet PaymentIntent de Stripe
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log(`✅ Paiement réussi! ID: ${paymentIntent.id}`);

  try {
    // Connecter à la DB si pas déjà connecté
    await dbConnect();
    
    // Vérifier si un ticket existe déjà
    const existingTicket = await Ticket.findOne({ paymentId: paymentIntent.id });
    if (existingTicket) {
      console.log(`ℹ️ Un ticket existe déjà pour ce paiement: ${paymentIntent.id}`);
      return;
    }

    // Retrouver l'utilisateur en base
    let user = await User.findOne({ paymentId: paymentIntent.id });
    
    // Si aucun utilisateur n'est trouvé, essayer de le créer à partir des métadonnées
    if (!user && paymentIntent.metadata) {
      console.log(`⚠️ Aucun utilisateur trouvé pour le paymentId=${paymentIntent.id}. Tentative de récupération depuis les métadonnées...`);
      
      const { customer_name, customer_firstName, customer_email } = paymentIntent.metadata;
      
      if (customer_email) {
        user = new User({
          email: customer_email || paymentIntent.receipt_email || "no-email@example.com",
          name: customer_name || "Utilisateur",
          firstName: customer_firstName || "Anonyme",
          paymentId: paymentIntent.id,
          imageConsent: true // Par défaut
        });
        
        await user.save();
        console.log(`✅ Utilisateur créé depuis les métadonnées: ${user.email}`);
      } else {
        console.log(`⚠️ Impossible de créer l'utilisateur: métadonnées insuffisantes`);
        return;
      }
    } else if (user) {
      console.log(`✅ Utilisateur trouvé: ${user.email}`);
    } else {
      console.log(`❌ Aucun utilisateur trouvé et impossible d'en créer un nouveau`);
      return;
    }

    // Déterminer la catégorie en fonction du nombre de tickets vendus
    const ticketCount = await Ticket.countDocuments();
    let category = "thirdRelease"; // Par défaut
    
    if (ticketCount < 30) {
      category = "earlyBird";
    } else if (ticketCount < 90) {
      category = "secondRelease";
    }

    // Créer le nouveau ticket en BDD
    const newTicket = new Ticket({
      paymentId: paymentIntent.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      category,
      imageConsent: user.imageConsent
    });
    
    await newTicket.save();
    console.log(`✅ Ticket créé en base pour: ${user.email}`);

    try {
      // Générer le PDF du billet
      console.log(`📄 Début génération PDF pour ${user.email}...`);
      const ticketData = await generateTicketPDF(
        user.name,
        user.firstName,
        user.email,
        paymentIntent.id,
        category
      );
      
      console.log(`✅ PDF généré avec succès: ${ticketData.filePath}`);
      
      // Envoi de l'email
      console.log(`📧 Début envoi email à ${user.email}...`);
      await sendTicketEmail(
        user.email,
        user.name,
        user.firstName,
        ticketData
      );
      
      console.log(`✅ Email envoyé avec succès à ${user.email}`);
    } catch (emailError) {
      console.error(`❌ Erreur lors de la génération/envoi de l'email:`, emailError);
      console.error(emailError.stack);
      // Ne pas faire échouer tout le processus, le ticket est déjà créé
    }
  } catch (error) {
    console.error(`❌ Erreur traitement paiement réussi:`, error);
    console.error(error.stack);
    throw error; // Propager l'erreur pour le traitement global
  }
}

/**
 * Gestion d'un paiement échoué
 * @param {Object} paymentIntent - Objet PaymentIntent de Stripe
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log(`⚠️ Paiement échoué! ID: ${paymentIntent.id}`);

  try {
    // Connecter à la DB si pas déjà connecté
    await dbConnect();
    
    const user = await User.findOne({ paymentId: paymentIntent.id });
    if (!user) {
      console.error(`❌ Utilisateur non trouvé pour le paiement échoué: ${paymentIntent.id}`);
      return;
    }
    
    console.log(`ℹ️ Paiement échoué pour: ${user.email}`);
    // Vous pourriez envoyer un email d'échec ici si nécessaire
  } catch (error) {
    console.error(`❌ Erreur traitement paiement échoué:`, error);
    console.error(error.stack);
    throw error; // Propager l'erreur pour le traitement global
  }
}