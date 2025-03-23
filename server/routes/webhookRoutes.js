// server/routes/webhookRoutes.js
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");
const Ticket = require("../models/ticket");
const { generateTicketPDF } = require("../utils/generateTicket");
const { sendTicketEmail } = require("../utils/emailService");
const fs = require("fs");
const path = require("path");

// Vérification et création des dossiers nécessaires
const dirs = [
  path.join(__dirname, '..', 'tickets'),
  path.join(__dirname, '..', 'qrcodes'),
  path.join(__dirname, '..', 'assets')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Dossier créé: ${dir}`);
  }
});

// Middleware pour les webhooks Stripe - utilise le corps brut
router.post("/", express.raw({ type: 'application/json' }), async (req, res) => {
    console.log("📩 Webhook Stripe reçu !");
    console.log("Headers:", JSON.stringify(req.headers));
    
    // Récupérer le corps de la requête en tant que Buffer
    const payload = req.body;
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Vérifier si nous avons le corps et la signature
        if (!payload) {
            console.error("❌ Webhook error: Payload vide ou manquant");
            return res.status(400).send("Webhook Error: Missing payload");
        }

        // Log pour le debugging
        console.log(`📦 Payload reçu (Buffer): ${Buffer.isBuffer(payload)}, Taille: ${payload.length} bytes`);
        console.log(`🔑 Signature présente: ${!!sig}`);
        console.log(`🔒 Secret configuré: ${!!process.env.STRIPE_WEBHOOK_SECRET}`);

        // Vérifier la signature
        if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
            try {
                event = stripe.webhooks.constructEvent(
                    payload, 
                    sig, 
                    process.env.STRIPE_WEBHOOK_SECRET
                );
                console.log(`✅ Signature Stripe vérifiée`);
            } catch (signatureError) {
                console.error(`❌ Erreur de signature webhook: ${signatureError.message}`);
                return res.status(400).send(`Webhook Signature Error: ${signatureError.message}`);
            }
        } else {
            // En développement uniquement, on peut accepter sans signature
            try {
                event = JSON.parse(payload.toString());
                console.log(`⚠️ Webhook sans vérification de signature (développement uniquement)`);
            } catch (parseError) {
                console.error(`❌ Erreur de parsing JSON:`, parseError);
                return res.status(400).send(`Webhook Error: Invalid JSON payload`);
            }
        }

        console.log(`✅ Type d'événement: ${event.type}`);

        // Traiter l'événement
        if (event.type === 'payment_intent.succeeded') {
            await handlePaymentIntentSucceeded(event.data.object);
            return res.status(200).send('Webhook handled: payment_intent.succeeded');
        } else if (event.type === 'payment_intent.payment_failed') {
            await handlePaymentIntentFailed(event.data.object);
            return res.status(200).send('Webhook handled: payment_intent.payment_failed');
        } else {
            console.log(`ℹ️ Événement non traité: ${event.type}`);
            return res.status(200).send(`Webhook received: ${event.type}`);
        }
    } catch (error) {
        console.error(`❌ Erreur webhook: ${error.message}`);
        console.error(error.stack);
        // Envoyer un 200 pour éviter que Stripe ne réessaie
        return res.status(200).send(`Webhook Error: ${error.message}`);
    }
});

/**
 * Gestion d'un paiement réussi avec journalisation détaillée
 * @param {Object} paymentIntent - Objet PaymentIntent de Stripe
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
    console.log(`✅ Paiement réussi! ID: ${paymentIntent.id}`);
    console.log(`📝 Traitement début: ${new Date().toISOString()}`);

    try {
        // Récupérer l'utilisateur
        console.log(`🔍 Recherche de l'utilisateur pour paymentId: ${paymentIntent.id}`);
        const user = await User.findOne({ paymentId: paymentIntent.id });

        if (!user) {
            console.error(`❌ Utilisateur non trouvé pour le paiement: ${paymentIntent.id}`);
            return;
        }

        console.log(`✅ Utilisateur trouvé: ${user.email}`);

        // Vérifier si un ticket existe déjà pour ce paiement
        console.log(`🔍 Vérification si un ticket existe déjà...`);
        const existingTicket = await Ticket.findOne({ paymentId: paymentIntent.id });
        if (existingTicket) {
            console.log(`ℹ️ Ticket déjà existant pour: ${paymentIntent.id}`);
            return;
        }

        // Déterminer la catégorie en fonction du nombre de tickets vendus
        console.log(`🔢 Calcul de la catégorie...`);
        const ticketCount = await Ticket.countDocuments();
        let category = "thirdRelease"; // Par défaut
        
        if (ticketCount < 30) {
            category = "earlyBird";
        } else if (ticketCount < 90) {
            category = "secondRelease";
        }

        console.log(`✅ Catégorie déterminée: ${category} (${ticketCount} tickets vendus)`);

        // Créer le nouveau ticket en BDD
        console.log(`📝 Création du ticket pour ${user.email} avec catégorie ${category}`);
        const ticket = new Ticket({
            paymentId: paymentIntent.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName,
            category,
            imageConsent: user.imageConsent
        });
        
        await ticket.save();
        console.log(`✅ Ticket créé en base pour: ${user.email}`);

        // Génération du PDF avec QR Code
        try {
            console.log(`🔄 Génération du PDF en cours...`);
            const ticketData = await generateTicketPDF(
                user.name,
                user.firstName,
                user.email,
                paymentIntent.id,
                category
            );
            
            console.log(`✅ PDF généré avec succès: ${ticketData.filePath}`);
            
            // Vérifier que le fichier existe
            if (fs.existsSync(ticketData.filePath)) {
                console.log(`✅ Fichier PDF vérifié: ${ticketData.filePath} (${fs.statSync(ticketData.filePath).size} bytes)`);
            } else {
                throw new Error(`Le fichier PDF n'existe pas après génération: ${ticketData.filePath}`);
            }
            
            // Envoyer l'email avec le billet
            console.log(`📧 Envoi de l'email à ${user.email}...`);
            await sendTicketEmail(
                user.email,
                user.name,
                user.firstName,
                ticketData
            );
            
            console.log(`✅ Email envoyé à: ${user.email}`);
        } catch (error) {
            console.error(`❌ Erreur génération/envoi du ticket: ${error.message}`);
            console.error(error.stack);
            // Même si l'envoi échoue, on ne veut pas perdre le ticket qui a été créé
        }
    } catch (error) {
        console.error(`❌ Erreur traitement paiement réussi: ${error.message}`);
        console.error(error.stack);
    }
}

/**
 * Gestion d'un paiement échoué
 * @param {Object} paymentIntent - Objet PaymentIntent de Stripe
 */
async function handlePaymentIntentFailed(paymentIntent) {
    console.log(`⚠️ Paiement échoué! ID: ${paymentIntent.id}`);

    try {
        const user = await User.findOne({ paymentId: paymentIntent.id });
        if (!user) {
            console.error(`❌ Utilisateur non trouvé pour le paiement échoué: ${paymentIntent.id}`);
            return;
        }
        
        console.log(`ℹ️ Paiement échoué pour: ${user.email}`);
        // Vous pourriez envoyer un email d'échec ici si nécessaire
    } catch (error) {
        console.error(`❌ Erreur traitement paiement échoué: ${error.message}`);
        console.error(error.stack);
    }
}

// Route de test pour webhook
router.post("/test", express.raw({ type: 'application/json' }), (req, res) => {
    console.log("Test webhook reçu!");
    console.log("Type de req.body:", typeof req.body);
    console.log("Est-ce un Buffer?", Buffer.isBuffer(req.body));
    
    // Si c'est un Buffer, tout va bien
    if (Buffer.isBuffer(req.body)) {
        const payload = req.body.toString();
        console.log("Payload (premiers 100 caractères):", payload.substring(0, 100));
        res.status(200).send("Test webhook reçu correctement comme Buffer!");
    } else {
        res.status(400).send("Erreur: req.body n'est pas un Buffer!");
    }
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

// Route de test pour générer un PDF
router.get("/test-pdf", async (req, res) => {
    try {
        console.log("📄 Test de génération de PDF démarré");
        
        // Données de test
        const name = "Doe";
        const firstName = "John";
        const email = "test@example.com";
        const paymentId = "TEST_" + Date.now();
        const category = "earlyBird";
        
        // Générer le PDF
        const ticketData = await generateTicketPDF(
            name,
            firstName,
            email,
            paymentId,
            category
        );
        
        console.log("✅ PDF généré avec succès:", ticketData);
        
        // Vérifier que le fichier existe
        if (fs.existsSync(ticketData.filePath)) {
            // Envoyer le PDF au client
            const fileBuffer = fs.readFileSync(ticketData.filePath);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=test_ticket.pdf`);
            return res.send(fileBuffer);
        } else {
            throw new Error(`Le fichier PDF n'existe pas après génération: ${ticketData.filePath}`);
        }
    } catch (error) {
        console.error("❌ Erreur lors du test de génération PDF:", error);
        res.status(500).send(`Erreur de test PDF: ${error.message}`);
    }
});

module.exports = router;