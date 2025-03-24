const https = require('https');
const http = require('http');
const crypto = require('crypto');
require('dotenv').config();

// Configuration 
const USE_HTTPS = false; // Mettre à true si votre endpoint est en HTTPS
const WEBHOOK_ENDPOINT = 'http://localhost:5000/api/payment/webhook'; // Modifier selon votre URL
const STRIPE_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Données de test simulant un événement Stripe
const testEvent = {
  id: 'evt_test_' + Math.random().toString(36).substring(2, 15),
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'pi_test_' + Math.random().toString(36).substring(2, 15),
      object: 'payment_intent',
      amount: 1500,
      currency: 'chf',
      description: 'Test payment from webhook',
      status: 'succeeded',
      receipt_email: 'test@example.com',
      metadata: {
        customer_name: 'Test',
        customer_firstName: 'User',
        customer_email: 'test@example.com'
      }
    }
  },
  type: 'payment_intent.succeeded',
  pending_webhooks: 1
};

// Convertir l'événement en JSON
const payload = JSON.stringify(testEvent);

// Calculer la signature si un secret est défini
let signature = '';
if (STRIPE_SECRET) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const hmac = crypto.createHmac('sha256', STRIPE_SECRET);
  hmac.update(signedPayload);
  const digest = hmac.digest('hex');
  signature = `t=${timestamp},v1=${digest}`;
  console.log(`✅ Generated test signature: ${signature}`);
} else {
  console.log('⚠️ No STRIPE_WEBHOOK_SECRET found, skipping signature generation');
}

// Préparer la requête
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'User-Agent': 'Stripe-Test-Webhook/v1',
    'Stripe-Signature': signature
  }
};

// Fonction d'envoi de la requête
const sendRequest = () => {
  console.log(`🚀 Sending test webhook to: ${WEBHOOK_ENDPOINT}`);
  
  const client = USE_HTTPS ? https : http;
  const req = client.request(WEBHOOK_ENDPOINT, options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);
    console.log(`📡 Headers: ${JSON.stringify(res.headers)}`);
    
    res.setEncoding('utf8');
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('📡 Response body:');
      try {
        const parsedResponse = JSON.parse(responseData);
        console.log(JSON.stringify(parsedResponse, null, 2));
      } catch (e) {
        console.log(responseData);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
  });
  
  // Envoyer les données
  req.write(payload);
  req.end();
  console.log('📤 Request sent');
};

// Exécuter l'envoi
sendRequest();