// scripts/webhook-test.js
// Script pour tester manuellement le webhook Stripe
require('dotenv').config();
const fetch = require('node-fetch');
const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:5000/api/webhook';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Fonction pour simuler un webhook Stripe
async function simulateWebhook() {
    // Créer un événement de test similaire à ceux envoyés par Stripe
    const timestamp = Math.floor(Date.now() / 1000);
    const paymentId = 'pi_' + crypto.randomBytes(24).toString('hex');
    
    // Simuler un événement payment_intent.succeeded
    const event = {
        id: 'evt_' + crypto.randomBytes(24).toString('hex'),
        object: 'event',
        api_version: '2020-08-27',
        created: timestamp,
        data: {
            object: {
                id: paymentId,
                object: 'payment_intent',
                amount: 1800, // 18.00 CHF en centimes
                currency: 'chf',
                status: 'succeeded',
                created: timestamp,
                metadata: {
                    customer_name: 'Test',
                    customer_firstName: 'Webhook',
                    customer_email: process.env.EMAIL_USER || 'test@example.com',
                }
            }
        },
        type: 'payment_intent.succeeded',
        livemode: false
    };
    
    // Convertir l'événement en JSON
    const payload = JSON.stringify(event);
    
    console.log(`🔄 Envoi d'un webhook simulé à ${WEBHOOK_URL}`);
    console.log(`🔍 Type d'événement: ${event.type}`);
    console.log(`🆔 Payment Intent ID: ${paymentId}`);
    console.log(`📧 Email: ${event.data.object.metadata.customer_email}`);
    
    // Headers par défaut
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // Générer une signature si un secret est fourni
    if (WEBHOOK_SECRET) {
        console.log("🔐 Génération d'une signature avec la clé secrète...");
        
        const signedPayload = `${timestamp}.${payload}`;
        const signature = crypto
            .createHmac('sha256', WEBHOOK_SECRET)
            .update(signedPayload)
            .digest('hex');
        
        // Ajouter l'en-tête signature au format utilisé par Stripe
        headers['stripe-signature'] = `t=${timestamp},v1=${signature}`;
        console.log('✅ Signature générée');
    } else {
        console.log('⚠️ Aucune clé secrète fournie, webhook envoyé sans signature');
    }
    
    try {
        // Envoyer la requête
        console.log('📤 Envoi de la requête...');
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: headers,
            body: payload
        });
        
        // Afficher le résultat
        const responseText = await response.text();
        console.log(`🛬 Réponse: ${response.status} ${response.statusText}`);
        console.log(`📄 Contenu: ${responseText}`);
        
        if (response.ok) {
            console.log('✅ Webhook accepté par le serveur');
            console.log('\n⚠️ IMPORTANT: Vérifiez les logs du serveur pour confirmer que le webhook a été traité correctement.');
            console.log('Si le serveur a répondu 200 mais n\'a pas traité l\'événement, le problème est dans la logique de traitement.');
        } else {
            console.log('❌ Webhook rejeté par le serveur');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi du webhook:', error);
    }
}

// Vérifier les prérequis
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY n\'est pas définie dans les variables d\'environnement');
    process.exit(1);
}

// Exécuter le test
console.log('🧪 DÉBUT DU TEST DE WEBHOOK STRIPE\n');
simulateWebhook();