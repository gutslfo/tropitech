const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");
const Ticket = require("../models/ticket");
const { generateTicketPDF, sendTicketEmail } = require("../utils/emailService");

router.post("/", async (req, res) => {
    console.log("📩 Webhook Stripe reçu !");
    
    try {
        // Obtenir les données de la requête
        const payload = req.body;
        
        // Si req.body est un Buffer (à cause de express.raw), convertissez-le en objet JSON
        const event = Buffer.isBuffer(payload) 
                     ? JSON.parse(payload.toString()) 
                     : payload;
        
        console.log(`✅ Type d'événement: ${event.type}`);
        
        // Traitement des différents types d'événements
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
        
        res.status(200).send('Webhook traité avec succès');
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
        res.status(500).send('Erreur interne du serveur');
    }
});

/**
 * Gestion d'un paiement réussi
 * @param {Object} paymentIntent - Objet PaymentIntent de Stripe
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
    console.log(`✅ Paiement réussi! ID: ${paymentIntent.id}`);
    
    try {
        // Récupérer les informations utilisateur
        const user = await User.findOne({ paymentId: paymentIntent.id });
        
        if (!user) {
            console.error(`❌ Utilisateur non trouvé pour le paiement: ${paymentIntent.id}`);
            // Pour les tests, on peut créer un utilisateur fictif
            console.log("⚠️ Création d'un utilisateur fictif pour les tests");
            const testUser = {
                email: paymentIntent.receipt_email || "test@example.com",
                name: "Test",
                firstName: "User",
                paymentId: paymentIntent.id,
                imageConsent: true
            };
            
            // Vous pouvez décommenter ces lignes si vous voulez créer l'utilisateur en base de données
            // const newUser = new User(testUser);
            // await newUser.save();
            
            // On continue avec l'utilisateur fictif
            return;
        }
        
        // Vérifier si un ticket existe déjà
        const existingTicket = await Ticket.findOne({ paymentId: paymentIntent.id });
        
        if (existingTicket) {
            console.log(`ℹ️ Ticket déjà existant pour: ${paymentIntent.id}`);
            return;
        }
        
        // Déterminer la catégorie du billet
        const ticketCount = await Ticket.countDocuments();
        let category = "thirdRelease"; // Catégorie par défaut
        
        if (ticketCount < 30) {
            category = "earlyBird";
        } else if (ticketCount < 90) { // 30 + 60
            category = "secondRelease";
        }
        
        console.log(`✅ Création du ticket pour ${user.email} avec catégorie ${category}`);
        
        // Créer un nouveau ticket
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
        
        // Générer le PDF et envoyer l'email
        try {
            const ticketData = await generateTicketPDF(
                user.name,
                user.firstName,
                user.email,
                paymentIntent.id,
                category
            );
            
            await sendTicketEmail(
                user.email,
                user.name,
                user.firstName,
                ticketData
            );
            
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
        // Récupérer les informations utilisateur
        const user = await User.findOne({ paymentId: paymentIntent.id });
        
        if (!user) {
            console.error(`❌ Utilisateur non trouvé pour le paiement échoué: ${paymentIntent.id}`);
            return;
        }
        
        // Vous pourriez envoyer un email de notification à l'utilisateur ici
        console.log(`ℹ️ Paiement échoué pour: ${user.email}`);
        
        // On pourrait également marquer l'utilisateur ou créer un log de l'échec
    } catch (error) {
        console.error(`❌ Erreur traitement paiement échoué: ${error.message}`);
    }
}

module.exports = router;