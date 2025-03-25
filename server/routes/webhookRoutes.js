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

// Cache simple pour les événements Stripe traités (stocké en mémoire)
// Note: Ce cache sera perdu si le serveur redémarre
const processedEvents = new Set();

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

        // NOUVEAU: Vérification d'idempotence - s'assurer qu'on ne traite pas deux fois le même événement
        const eventId = event.id;
        if (processedEvents.has(eventId)) {
            console.log(`⚠️ Événement ${eventId} déjà traité précédemment - Ignoré`);
            return res.status(200).send('Webhook event already processed');
        }
        
        console.log(`✅ Type d'événement: ${event.type}`);

        // Traiter l'événement selon son type
        if (event.type === 'payment_intent.succeeded') {
            await handlePaymentIntentSucceeded(event.data.object);
            // Ajouter l'ID de l'événement à la liste des événements traités
            processedEvents.add(eventId);
            return res.status(200).send('Webhook handled: payment_intent.succeeded');
        } else if (event.type === 'payment_intent.payment_failed') {
            await handlePaymentIntentFailed(event.data.object);
            processedEvents.add(eventId);
            return res.status(200).send('Webhook handled: payment_intent.payment_failed');
        } else {
            console.log(`ℹ️ Événement non traité: ${event.type}`);
            return res.status(200).send(`Webhook received but not handled: ${event.type}`);
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
    console.log(`📝 Flux d'exécution début: ${new Date().toISOString()}`);

    try {
        // Vérifier si un ticket existe déjà - VÉRIFICATION RENFORCÉE
        console.log(`🔍 Vérification rigoureuse si un ticket existe déjà...`);
        const existingTicket = await Ticket.findOne({ paymentId: paymentIntent.id });
        
        if (existingTicket) {
            console.log(`ℹ️ Ticket déjà existant pour: ${paymentIntent.id} - ARRÊT DU TRAITEMENT`);
            return; // Sortir immédiatement si un ticket existe déjà
        }

        // Récupérer l'utilisateur
        console.log(`🔍 Recherche de l'utilisateur pour paymentId: ${paymentIntent.id}`);
        let user = await User.findOne({ paymentId: paymentIntent.id });

        // Si aucun utilisateur n'est trouvé, essayer de le créer à partir des métadonnées
        if (!user && paymentIntent.metadata) {
            console.log(`⚠️ Aucun utilisateur trouvé pour paymentId=${paymentIntent.id}. Tentative de récupération depuis les métadonnées...`);
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
            console.error(`❌ Utilisateur non trouvé pour le paiement: ${paymentIntent.id}`);
            return;
        }

        // Ajout d'une vérification supplémentaire JUSTE AVANT de créer le ticket
        const doubleCheck = await Ticket.findOne({ paymentId: paymentIntent.id });
        if (doubleCheck) {
            console.log(`⚠️ Un ticket a été créé entre-temps! Arrêt du traitement pour éviter les doublons.`);
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
            imageConsent: user.imageConsent,
            emailSent: false,  // Par défaut, l'email n'est pas encore envoyé
            emailAttempts: 0   // Compteur de tentatives d'envoi
        });
        
        await ticket.save();
        console.log(`✅ Ticket créé en base pour: ${user.email} (ID: ${ticket._id})`);

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
            
            // Mettre à jour le ticket avec le chemin du PDF
            await Ticket.findByIdAndUpdate(ticket._id, {
                pdfPath: ticketData.filePath
            });
            
            // Vérifier que le fichier existe
            if (fs.existsSync(ticketData.filePath)) {
                console.log(`✅ Fichier PDF vérifié: ${ticketData.filePath} (${fs.statSync(ticketData.filePath).size} bytes)`);
                
                // Envoyer l'email avec le billet
                console.log(`📧 Envoi de l'email à ${user.email}...`);
                const emailResult = await sendTicketEmail(
                    user.email,
                    user.name,
                    user.firstName,
                    ticketData
                );
                
                // Mettre à jour le statut d'envoi dans le ticket
                await Ticket.findByIdAndUpdate(ticket._id, {
                    emailSent: true,
                    emailSentAt: new Date(),
                    emailAttempts: 1,
                    emailMessageId: emailResult.messageId || 'undefined'
                });
                
                console.log(`✅ Email envoyé à: ${user.email}`, emailResult ? `(ID: ${emailResult.messageId})` : '');
            } else {
                throw new Error(`Le fichier PDF n'existe pas après génération: ${ticketData.filePath}`);
            }
        } catch (error) {
            console.error(`❌ Erreur génération/envoi du ticket: ${error.message}`);
            console.error(error.stack);
            
            // Mettre à jour le ticket pour indiquer l'échec
            await Ticket.findByIdAndUpdate(ticket._id, {
                emailAttempts: 1,
                emailError: error.message
            });
        }
        
        console.log(`📝 Flux d'exécution terminé: ${new Date().toISOString()}`);
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

// Nettoyage périodique des événements traités pour éviter une fuite de mémoire
// Conserver uniquement les 1000 événements les plus récents
setInterval(() => {
    if (processedEvents.size > 1000) {
        const eventsArray = Array.from(processedEvents);
        const eventsToRemove = eventsArray.slice(0, eventsArray.length - 1000);
        eventsToRemove.forEach(eventId => processedEvents.delete(eventId));
        console.log(`🧹 Nettoyage du cache d'événements: ${eventsToRemove.length} événements anciens supprimés`);
    }
}, 24 * 60 * 60 * 1000); // Nettoyer une fois par jour

// Exporter le routeur
module.exports = router;