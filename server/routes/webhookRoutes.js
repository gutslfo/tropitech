// server/routes/webhookRoutes.js
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");
const Ticket = require("../models/ticket");
const { generateTicketPDF, sendTicketEmail } = require("../utils/emailService");
const fs = require("fs");
const path = require("path");

// Middleware pour les webhooks Stripe - utilise le corps brut
router.post("/", express.raw({ type: 'application/json' }), async (req, res) => {
    console.log("📩 Webhook Stripe reçu !");
    
    // Récupérer le corps de la requête en tant que Buffer
    const payload = req.body;
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Vérifier la signature si un secret est configuré
        if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
            event = stripe.webhooks.constructEvent(
                payload, 
                sig, 
                process.env.STRIPE_WEBHOOK_SECRET
            );
            console.log(`✅ Signature Stripe vérifiée`);
        } else {
            // Sinon, juste parser le JSON
            event = JSON.parse(payload.toString());
            console.log(`⚠️ Webhook sans vérification de signature`);
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
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

/**
 * Gestion d'un paiement réussi
 * @param {Object} paymentIntent - Objet PaymentIntent de Stripe
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
    console.log(`✅ Paiement réussi! ID: ${paymentIntent.id}`);

    try {
        // Récupérer l'utilisateur
        const user = await User.findOne({ paymentId: paymentIntent.id });

        if (!user) {
            console.error(`❌ Utilisateur non trouvé pour le paiement: ${paymentIntent.id}`);
            return;
        }

        console.log(`✅ Utilisateur trouvé: ${user.email}`);

        // Vérifier si un ticket existe déjà pour ce paiement
        const existingTicket = await Ticket.findOne({ paymentId: paymentIntent.id });
        if (existingTicket) {
            console.log(`ℹ️ Ticket déjà existant pour: ${paymentIntent.id}`);
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

        console.log(`✅ Création du ticket pour ${user.email} avec catégorie ${category}`);

        // Créer le nouveau ticket en BDD
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

        // Générer le PDF du billet
        try {
            // Générer le PDF avec QR Code
            const ticketData = await generateTicketPDF(
                user.name,
                user.firstName,
                user.email,
                paymentIntent.id,
                category
            );
            
            console.log('✅ PDF généré avec succès:', ticketData);
            
            // Envoyer l'email avec le billet
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

module.exports = router;