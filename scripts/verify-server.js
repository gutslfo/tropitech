// scripts/verify-system.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log('🔍 Démarrage de la vérification du système billetterie Tropitech...');

// Vérifier les variables d'environnement essentielles
async function checkEnvironment() {
  console.log('\n--- VÉRIFICATION DE L\'ENVIRONNEMENT ---');
  const requiredVars = [
    'MONGO_URI',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'EMAIL_USER',
    'EMAIL_PASS'
  ];
  
  let missingVars = [];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
      console.log(`❌ ${varName} non définie`);
    } else {
      console.log(`✅ ${varName} définie`);
    }
  });
  
  if (missingVars.length > 0) {
    console.log(`⚠️ Variables manquantes: ${missingVars.join(', ')}`);
    console.log(`💡 Créez un fichier .env à la racine avec ces variables`);
  }
  
  return missingVars.length === 0;
}

// Vérifier les dossiers nécessaires
async function checkDirectories() {
  console.log('\n--- VÉRIFICATION DES DOSSIERS ---');
  
  const dirs = [
    path.join(__dirname, '..', 'server', 'tickets'),
    path.join(__dirname, '..', 'server', 'qrcodes'),
    path.join(__dirname, '..', 'server', 'assets')
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      console.log(`🔄 Création du dossier: ${dir}`);
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Dossier créé: ${dir}`);
      } catch (error) {
        console.log(`❌ Erreur lors de la création du dossier ${dir}: ${error.message}`);
        return false;
      }
    } else {
      console.log(`✅ Dossier existant: ${dir}`);
      
      // Vérifier les permissions d'écriture
      try {
        const testFile = path.join(dir, `test-${Date.now()}.txt`);
        fs.writeFileSync(testFile, 'Test');
        fs.unlinkSync(testFile);
        console.log(`✅ Permissions d'écriture OK pour ${dir}`);
      } catch (error) {
        console.log(`❌ Problème de permissions pour ${dir}: ${error.message}`);
        return false;
      }
    }
  }
  
  return true;
}

// Tester la connexion MongoDB
async function checkMongoDB() {
  console.log('\n--- TEST DE CONNEXION MONGODB ---');
  
  if (!process.env.MONGO_URI) {
    console.log('❌ MONGO_URI non définie, test impossible');
    return false;
  }
  
  try {
    console.log(`🔄 Tentative de connexion à MongoDB: ${process.env.MONGO_URI}`);
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ Connexion MongoDB réussie');
    
    // Vérifier que les modèles sont définis
    try {
      const UserModel = require('../server/models/User');
      const TicketModel = require('../server/models/ticket');
      console.log('✅ Modèles chargés avec succès');
      
      // Lister les collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`ℹ️ Collections disponibles: ${collections.map(c => c.name).join(', ')}`);
    } catch (modelError) {
      console.log(`❌ Erreur de chargement des modèles: ${modelError.message}`);
    }
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log(`❌ Erreur de connexion MongoDB: ${error.message}`);
    return false;
  }
}

// Tester la génération de PDF et QR Code
async function checkPdfGeneration() {
  console.log('\n--- TEST DE GÉNÉRATION PDF ET QR CODE ---');
  
  try {
    // Test QR Code
    console.log('🔄 Test de génération de QR Code...');
    const qrPath = path.join(__dirname, 'test-qr.png');
    await QRCode.toFile(qrPath, 'https://tropitech.ch/test');
    
    if (fs.existsSync(qrPath)) {
      console.log(`✅ QR Code généré: ${qrPath}`);
      fs.unlinkSync(qrPath);
    } else {
      throw new Error('QR Code non généré');
    }
    
    // Test PDF
    console.log('🔄 Test de génération de PDF...');
    const pdfPath = path.join(__dirname, 'test-ticket.pdf');
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(25).text('Test PDF Tropitech', 100, 100);
    doc.end();
    
    // Attendre que le fichier soit écrit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (fs.existsSync(pdfPath)) {
      console.log(`✅ PDF généré: ${pdfPath}`);
      fs.unlinkSync(pdfPath);
      return true;
    } else {
      throw new Error('PDF non généré');
    }
  } catch (error) {
    console.log(`❌ Erreur dans la génération PDF/QR: ${error.message}`);
    return false;
  }
}

// Tester la connexion Stripe
async function checkStripe() {
  console.log('\n--- TEST DE CONNEXION STRIPE ---');
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('❌ STRIPE_SECRET_KEY non définie, test impossible');
    return false;
  }
  
  try {
    console.log('🔄 Récupération des informations du compte Stripe...');
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Connexion Stripe OK (Compte: ${account.id})`);
    
    console.log('🔄 Vérification du webhook secret...');
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      console.log('✅ STRIPE_WEBHOOK_SECRET est définie');
    } else {
      console.log('⚠️ STRIPE_WEBHOOK_SECRET non définie - les webhooks ne fonctionneront pas correctement');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Erreur Stripe: ${error.message}`);
    return false;
  }
}

// Tester la connexion email
async function checkEmail() {
  console.log('\n--- TEST DE CONFIGURATION EMAIL ---');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ EMAIL_USER ou EMAIL_PASS non définis, test impossible');
    return false;
  }
  
  try {
    console.log('🔄 Test de connexion au service email...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    await transporter.verify();
    console.log('✅ Connexion email réussie');
    return true;
  } catch (error) {
    console.log(`❌ Erreur de configuration email: ${error.message}`);
    console.log('💡 Pour Gmail, assurez-vous d\'utiliser un "mot de passe d\'application"');
    return false;
  }
}

// Exécuter tous les tests
async function runAllChecks() {
  console.log('🚀 DÉMARRAGE DES VÉRIFICATIONS SYSTÈME\n');
  
  const envOk = await checkEnvironment();
  const dirsOk = await checkDirectories();
  const mongoOk = await checkMongoDB();
  const pdfOk = await checkPdfGeneration();
  const stripeOk = await checkStripe();
  const emailOk = await checkEmail();
  
  console.log('\n=== RÉSUMÉ DES VÉRIFICATIONS ===');
  console.log(`${envOk ? '✅' : '❌'} Variables d'environnement`);
  console.log(`${dirsOk ? '✅' : '❌'} Dossiers et permissions`);
  console.log(`${mongoOk ? '✅' : '❌'} Connexion MongoDB`);
  console.log(`${pdfOk ? '✅' : '❌'} Génération PDF et QR Code`);
  console.log(`${stripeOk ? '✅' : '❌'} Configuration Stripe`);
  console.log(`${emailOk ? '✅' : '❌'} Configuration Email`);
  
  const allOk = envOk && dirsOk && mongoOk && pdfOk && stripeOk && emailOk;
  
  console.log('\n');
  if (allOk) {
    console.log('✅ SYSTÈME PRÊT À FONCTIONNER');
  } else {
    console.log('⚠️ CERTAINES VÉRIFICATIONS ONT ÉCHOUÉ');
    console.log('Corrigez les problèmes signalés ci-dessus pour assurer le bon fonctionnement du système');
  }
  
  return allOk;
}

// Exécuter le script
runAllChecks().catch(error => {
  console.error('❌ Erreur lors des vérifications:', error);
}).finally(() => {
  // Fermer les connexions ouvertes
  if (mongoose.connection.readyState !== 0) {
    mongoose.disconnect();
  }
});