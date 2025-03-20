const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");
const Ticket = require("../models/ticket");
const { generateTicketPDF, sendTicketEmail } = require("../utils/emailService");

router.post("/", async (req, res) => {
    console.log("📩 Webhook Stripe reçu !");

    try {
        // Récupérer le corps brut ou déjà parsé
        // ATTENTION : si vous vouliez vérifier la signature Stripe, il faut configurer express.raw et stripe.webhooks.constructEvent
        const payload = req.body;
        const event = Buffer.isBuffer(payload) 
            ? JSON.parse(payload.toString()) 
            : payload;

        console.log(`✅ Type d'événement: ${event.type}`);

        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;
            
            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;
            
            default:
                console.log(`ℹ️ Événement non traité: ${event.type}`);
        }

        return res.status(200).send('Webhook traité avec succès');
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
        return res.status(500).send('Erreur interne du serveur');
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
            console.log("⚠️ Création d'un utilisateur fictif (test)"); 
            // Décommentez si vous voulez créer un user en test
            // const testUser = {
            //     email: paymentIntent.receipt_email || "test@example.com",
            //     name: "Test",
            //     firstName: "User",
            //     paymentId: paymentIntent.id,
            //     imageConsent: true
            // };
            // const newUser = new User(testUser);
            // await newUser.save();
            
            return; // On sort, donc pas de ticket ni d'email
        }

        // Vérifier si un ticket existe déjà pour ce paiement
        const existingTicket = await Ticket.findOne({ paymentId: paymentIntent.id });
        if (existingTicket) {
            console.log(`ℹ️ Ticket déjà existant pour: ${paymentIntent.id}`);
            return;
        }

        // Déterminer la catégorie
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
        console.log(`✅ Ticket créé pour: ${user.email}`);

        // Générer le PDF + envoyer l'email
        try {
            const ticketData = await generateTicketPDF(
                user.name,
                user.firstName,
                user.email,
                paymentIntent.id,
                category
            );
            await sendTicketEmail(user.email, user.name, user.firstName, ticketData);

            console.log(`✅ Email envoyé à: ${user.email}`);
        } catch (error) {
            console.error(`❌ Erreur génération/envoi du ticket: ${error.message}`);
        }
    } catch (error) {
        console.error(`❌ Erreur traitement paiement réussi: ${error.message}`);
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
        // Envoyer un email d'erreur si vous le souhaitez
    } catch (error) {
        console.error(`❌ Erreur traitement paiement échoué: ${error.message}`);
    }
}

module.exports = router;
