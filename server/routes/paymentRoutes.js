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

    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Format d'email invalide",
        details: "Veuillez fournir une adresse email valide" 
      });
    }

    // Validation du montant
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        error: "Montant invalide",
        details: "Le montant doit être un nombre positif" 
      });
    }

    // Validation de la longueur des noms
    if (name.length > 100 || firstName.length > 100) {
      return res.status(400).json({ 
        error: "Données trop longues",
        details: "Le nom et prénom ne doivent pas dépasser 100 caractères" 
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
    
    // Erreurs Stripe spécifiques
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ 
        error: "Erreur de carte bancaire", 
        details: error.message 
      });
    } else if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({ 
        error: "Trop de requêtes", 
        details: "Veuillez réessayer dans quelques instants" 
      });
    } else if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: "Requête invalide", 
        details: process.env.NODE_ENV === 'development' ? error.message : "Paramètres de requête invalides" 
      });
    } else if (error.type === 'StripeAPIError') {
      return res.status(503).json({ 
        error: "Erreur API Stripe", 
        details: "Le service de paiement est temporairement indisponible" 
      });
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(409).json({ 
        error: "Duplication", 
        details: "Ce paiement a déjà été enregistré" 
      });
    }
    
    // Erreur par défaut
    return res.status(500).json({ 
      error: "Erreur lors de la création du paiement",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/*
* Gestion d'un paiement réussi avec journalisation détaillée
* @param {Object} paymentIntent - Objet PaymentIntent de Stripe
*/
async function handlePaymentIntentSucceeded(paymentIntent) {
 console.log(`✅ Paiement réussi! ID: ${paymentIntent.id}`);
 console.log(`📝 Flux d'exécution début: ${new Date().toISOString()}`);

 try {
   // Connecter à la DB si pas déjà connecté
   console.log(`🔄 Tentative de connexion à la base de données...`);
   await dbConnect();
   console.log(`✅ Connexion à la base de données réussie`);
   
   // Vérifier si un ticket existe déjà
   console.log(`🔍 Recherche d'un ticket existant pour paymentId: ${paymentIntent.id}`);
   const existingTicket = await Ticket.findOne({ paymentId: paymentIntent.id });
   if (existingTicket) {
     console.log(`ℹ️ Un ticket existe déjà pour ce paiement: ${paymentIntent.id}`);
     return;
   }
   console.log(`✅ Aucun ticket existant trouvé, création d'un nouveau ticket...`);

   // Retrouver l'utilisateur en base
   console.log(`🔍 Recherche de l'utilisateur pour paymentId: ${paymentIntent.id}`);
   let user = await User.findOne({ paymentId: paymentIntent.id });
   
   // Si aucun utilisateur n'est trouvé, essayer de le créer à partir des métadonnées
   if (!user && paymentIntent.metadata) {
     console.log(`⚠️ Aucun utilisateur trouvé pour le paymentId=${paymentIntent.id}. Tentative de récupération depuis les métadonnées...`);
     console.log(`📋 Métadonnées disponibles:`, paymentIntent.metadata);
     
     const { customer_name, customer_firstName, customer_email } = paymentIntent.metadata;
     
     if (customer_email) {
       console.log(`📝 Création d'un nouvel utilisateur à partir des métadonnées...`);
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
       // Debug: afficher toutes les métadonnées disponibles
       console.log('Métadonnées Stripe disponibles:', JSON.stringify(paymentIntent));
       return;
     }
   } else if (user) {
     console.log(`✅ Utilisateur trouvé: ${user.email}`);
   } else {
     console.log(`❌ Aucun utilisateur trouvé et impossible d'en créer un nouveau`);
     return;
   }

   // Déterminer la catégorie en fonction du nombre de tickets vendus
   console.log(`🔢 Calcul de la catégorie en fonction du nombre de tickets vendus...`);
   const ticketCount = await Ticket.countDocuments();
   console.log(`📊 Nombre total de tickets vendus: ${ticketCount}`);
   
   let category = "thirdRelease"; // Par défaut
   
   if (ticketCount < 30) {
     category = "earlyBird";
   } else if (ticketCount < 90) {
     category = "secondRelease";
   }
   console.log(`✅ Catégorie déterminée: ${category}`);

   // Créer le nouveau ticket en BDD
   console.log(`📝 Création d'un nouveau ticket en base de données...`);
   const newTicket = new Ticket({
     paymentId: paymentIntent.id,
     email: user.email,
     name: user.name,
     firstName: user.firstName,
     category,
     imageConsent: user.imageConsent
   });
   
   await newTicket.save();
   console.log(`✅ Ticket créé en base pour: ${user.email} (ID: ${newTicket._id})`);

   // Bloc pour générer et envoyer le PDF
   console.log(`📄 Début du processus d'envoi de PDF...`);
   try {
     // Générer le PDF du billet
     console.log(`📄 Génération du PDF pour ${user.email}...`);
     const ticketData = await generateTicketPDF(
       user.name,
       user.firstName,
       user.email,
       paymentIntent.id,
       category
     );
     
     console.log(`✅ PDF généré avec succès: ${ticketData.filePath}`);
     console.log(`📊 Informations sur le fichier PDF:`);
     
     try {
       const stats = fs.statSync(ticketData.filePath);
       console.log(`- Taille: ${stats.size} octets`);
       console.log(`- Créé le: ${stats.birthtime}`);
       console.log(`- Permissions: ${stats.mode.toString(8)}`);
     } catch (statError) {
       console.error(`❌ Erreur lors de la vérification du fichier:`, statError);
     }
     
     // Envoi de l'email
     console.log(`📧 Début de l'envoi de l'email à ${user.email}...`);
     
     // Test de la configuration email avant envoi
     try {
       const { sendTicketEmail } = require("../utils/emailService");
       const nodemailer = require("nodemailer");
       
       // Créer un transporteur de test
       const testTransporter = nodemailer.createTransport({
         host: "smtp.gmail.com",
         port: 465,
         secure: true,
         auth: {
           user: process.env.EMAIL_USER,
           pass: process.env.EMAIL_PASS,
         }
       });
       
       console.log(`🔄 Test de la connexion email avant envoi...`);
       await testTransporter.verify();
       console.log(`✅ Test de connexion email réussi`);
       
       // Envoi du véritable email avec le ticket
       await sendTicketEmail(
         user.email,
         user.name,
         user.firstName,
         ticketData
       );
       
       console.log(`✅ Email envoyé avec succès à ${user.email}`);
     } catch (emailTestError) {
       console.error(`❌ Erreur dans le test de connexion email:`, emailTestError);
       throw emailTestError; // Re-lancer pour être capturé par le bloc parent
     }
   } catch (emailError) {
     console.error(`❌ Erreur lors de la génération/envoi de l'email:`, emailError);
     console.error(emailError.stack);
     // Ne pas faire échouer tout le processus, le ticket est déjà créé
   }
   
   console.log(`📝 Flux d'exécution terminé: ${new Date().toISOString()}`);
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

// Ajoutez ceci à la fin de votre webhookRoutes.js
router.post("/test", express.raw({ type: 'application/json' }), (req, res) => {
  console.log("Test webhook reçu!");
  console.log("Type de req.body:", typeof req.body); // Devrait être "object" (Buffer)
  console.log("Est-ce un Buffer?", Buffer.isBuffer(req.body)); // Devrait être true
  
  // Si c'est un Buffer, tout va bien
  if (Buffer.isBuffer(req.body)) {
    const payload = req.body.toString();
    console.log("Payload (premiers 100 caractères):", payload.substring(0, 100));
    res.status(200).send("Test webhook reçu correctement comme Buffer!");
  } else {
    res.status(400).send("Erreur: req.body n'est pas un Buffer!");
  }
});

// Exporter les fonctions de gestion des paiements
module.exports = {
  router,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed
};