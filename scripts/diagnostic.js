// scripts/diagnostic.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

console.log('🔍 Démarrage du diagnostic du système de billetterie Tropitech...');

// Fonction pour vérifier les variables d'environnement
async function checkEnvVariables() {
    console.log('\n--- VARIABLES D\'ENVIRONNEMENT ---');
    
    const requiredVars = [
        'MONGO_URI',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'EMAIL_USER',
        'EMAIL_PASS'
    ];
    
    let allOk = true;
    
    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            console.log(`❌ ${varName}: Non définie`);
            allOk = false;
        } else {
            const maskedValue = varName.includes('SECRET') || varName.includes('PASS') 
                ? '****' 
                : process.env[varName].substring(0, 10) + '...';
            console.log(`✅ ${varName}: ${maskedValue}`);
        }
    }
    
    return allOk;
}

// Fonction pour vérifier les dossiers
async function checkDirectories() {
    console.log('\n--- VÉRIFICATION DES DOSSIERS ---');
    
    const serverDir = path.join(__dirname, '..', 'server');
    const requiredDirs = [
        { path: path.join(serverDir, 'assets'), name: 'Assets' },
        { path: path.join(serverDir, 'tickets'), name: 'Tickets' },
        { path: path.join(serverDir, 'qrcodes'), name: 'QR Codes' }
    ];
    
    // Vérifier si le dossier server existe
    if (!fs.existsSync(serverDir)) {
        console.log(`❌ Dossier server non trouvé à ${serverDir}`);
        console.log(`ℹ️ Création du dossier server...`);
        try {
            fs.mkdirSync(serverDir, { recursive: true });
            console.log(`✅ Dossier server créé à ${serverDir}`);
        } catch (error) {
            console.log(`❌ Erreur lors de la création du dossier server: ${error.message}`);
        }
    }
    
    let allOk = true;
    
    // Vérifier les dossiers requis
    for (const dir of requiredDirs) {
        if (!fs.existsSync(dir.path)) {
            console.log(`❌ Dossier ${dir.name} non trouvé à ${dir.path}`);
            console.log(`ℹ️ Création du dossier ${dir.name}...`);
            try {
                fs.mkdirSync(dir.path, { recursive: true });
                console.log(`✅ Dossier ${dir.name} créé à ${dir.path}`);
            } catch (error) {
                console.log(`❌ Erreur lors de la création du dossier ${dir.name}: ${error.message}`);
                allOk = false;
            }
        } else {
            console.log(`✅ Dossier ${dir.name} trouvé à ${dir.path}`);
            // Vérifier les permissions
            try {
                const testFile = path.join(dir.path, `test_${Date.now()}.txt`);
                fs.writeFileSync(testFile, 'Test d\'écriture');
                fs.unlinkSync(testFile);
                console.log(`✅ Permissions d'écriture OK pour ${dir.name}`);
            } catch (error) {
                console.log(`❌ Erreur de permission pour ${dir.name}: ${error.message}`);
                allOk = false;
            }
        }
    }
    
    // Vérifier le fichier logo.png
    const logoPath = path.join(serverDir, 'assets', 'logo.png');
    if (!fs.existsSync(logoPath)) {
        console.log(`❌ Logo non trouvé à ${logoPath}`);
        console.log(`ℹ️ Création d'un logo de substitution...`);
        
        try {
            // Créer un logo de substitution simple (texte)
            const { createCanvas } = require('canvas');
            const canvas = createCanvas(200, 200);
            const ctx = canvas.getContext('2d');
            
            // Dessiner un fond noir
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 200, 200);
            
            // Ajouter un texte blanc
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('TROPI', 100, 80);
            ctx.fillText('TECH', 100, 130);
            
            // Sauvegarder le logo
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(logoPath, buffer);
            console.log(`✅ Logo de substitution créé à ${logoPath}`);
        } catch (error) {
            console.log(`❌ Erreur lors de la création du logo: ${error.message}`);
            allOk = false;
        }
    } else {
        console.log(`✅ Logo trouvé à ${logoPath}`);
    }
    
    // Vérifier la police
    const fontPath = path.join(serverDir, 'assets', 'Barbra-Regular.ttf');
    if (!fs.existsSync(fontPath)) {
        console.log(`❌ Police Barbra non trouvée à ${fontPath}`);
        console.log(`ℹ️ Note: Le système utilisera une police de substitution`);
    } else {
        console.log(`✅ Police Barbra trouvée à ${fontPath}`);
    }
    
    return allOk;
}

// Fonction pour tester la connexion MongoDB
async function testMongoDB() {
    console.log('\n--- TEST DE CONNEXION MONGODB ---');
    
    if (!process.env.MONGO_URI) {
        console.log('❌ MONGO_URI non définie, test impossible');
        return false;
    }
    
    try {
        console.log('🔄 Tentative de connexion à MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log(`✅ Connexion à MongoDB réussie`);
        
        // Vérifier que les modèles sont accessibles
        try {
            // Tenter de charger les modèles
            const UserPath = path.join(__dirname, '..', 'server', 'models', 'User.js');
            const TicketPath = path.join(__dirname, '..', 'server', 'models', 'ticket.js');
            
            if (fs.existsSync(UserPath) && fs.existsSync(TicketPath)) {
                console.log('✅ Fichiers des modèles trouvés');
                
                // Tenter de charger les modèles
                try {
                    const User = require(UserPath);
                    const Ticket = require(TicketPath);
                    console.log('✅ Modèles chargés avec succès');
                    
                    // Vérifier les collections
                    const collections = Object.keys(mongoose.connection.collections);
                    console.log(`ℹ️ Collections disponibles: ${collections.join(', ')}`);
                } catch (modelError) {
                    console.log(`❌ Erreur lors du chargement des modèles: ${modelError.message}`);
                }
            } else {
                console.log('❌ Fichiers des modèles non trouvés');
            }
        } catch (modelError) {
            console.log(`❌ Erreur lors de la vérification des modèles: ${modelError.message}`);
        }
        
        await mongoose.disconnect();
        console.log('✅ Déconnexion de MongoDB réussie');
        return true;
    } catch (error) {
        console.log(`❌ Erreur de connexion à MongoDB: ${error.message}`);
        return false;
    }
}

// Fonction pour tester le service d'email
async function testEmailService() {
    console.log('\n--- TEST DU SERVICE D\'EMAIL ---');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('❌ EMAIL_USER ou EMAIL_PASS non défini, test impossible');
        return false;
    }
    
    try {
        console.log('🔄 Tentative de connexion au service d\'email...');
        
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        
        // Vérifier la connexion
        await transporter.verify();
        console.log('✅ Connexion au service d\'email réussie');
        
        // Envoyer un email de test
        console.log('🔄 Envoi d\'un email de test...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Envoi à soi-même pour le test
            subject: "Test de diagnostic Tropitech",
            text: "Ceci est un test automatique du système de billetterie Tropitech.",
            html: "<p>Ceci est un test automatique du système de billetterie <b>Tropitech</b>.</p>",
        });
        
        console.log(`✅ Email de test envoyé avec succès (ID: ${info.messageId})`);
        
        return true;
    } catch (error) {
        console.log(`❌ Erreur du service d'email: ${error.message}`);
        
        // Essayer une configuration alternative
        try {
            console.log('🔄 Tentative avec une configuration alternative...');
            
            const transporterAlt = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            
            await transporterAlt.verify();
            console.log('✅ Connexion alternative au service d\'email réussie');
            
            return true;
        } catch (altError) {
            console.log(`❌ Erreur de la configuration alternative: ${altError.message}`);
            return false;
        }
    }
}

// Fonction pour tester la génération de PDF et QR Code
async function testPdfGeneration() {
    console.log('\n--- TEST DE GÉNÉRATION PDF ET QR CODE ---');
    
    try {
        console.log('🔄 Test de génération de QR Code...');
        
        const qrCodePath = path.join(__dirname, 'test_qrcode.png');
        
        // Générer un QR code basique
        await QRCode.toFile(qrCodePath, 'https://tropitech.ch/test');
        
        if (fs.existsSync(qrCodePath)) {
            console.log(`✅ QR Code généré avec succès à ${qrCodePath}`);
            fs.unlinkSync(qrCodePath);
            console.log('✅ QR Code supprimé après test');
        } else {
            throw new Error('QR Code non créé');
        }
        
        console.log('🔄 Test de génération de PDF...');
        const pdfPath = path.join(__dirname, 'test_ticket.pdf');
        
        // Créer un PDF simple
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);
        
        doc.fontSize(25).text('Test de PDF Tropitech', 100, 100);
        doc.end();
        
        // Attendre que le stream soit terminé
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });
        
        if (fs.existsSync(pdfPath)) {
            console.log(`✅ PDF généré avec succès à ${pdfPath}`);
            fs.unlinkSync(pdfPath);
            console.log('✅ PDF supprimé après test');
        } else {
            throw new Error('PDF non créé');
        }
        
        return true;
    } catch (error) {
        console.log(`❌ Erreur de génération PDF/QR Code: ${error.message}`);
        return false;
    }
}

// Fonction pour tester la configuration Stripe
async function testStripeConfig() {
    console.log('\n--- TEST DE CONFIGURATION STRIPE ---');
    
    if (!process.env.STRIPE_SECRET_KEY) {
        console.log('❌ STRIPE_SECRET_KEY non définie, test impossible');
        return false;
    }
    
    try {
        console.log('🔄 Initialisation de Stripe...');
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        // Tester la connexion en récupérant la configuration du compte
        console.log('🔄 Récupération des informations du compte...');
        const account = await stripe.accounts.retrieve();
        
        console.log(`✅ Configuration Stripe OK (type de compte: ${account.type})`);
        
        // Vérifier la configuration webhook
        if (process.env.STRIPE_WEBHOOK_SECRET) {
            console.log('✅ STRIPE_WEBHOOK_SECRET est définie');
            
            console.log('🔜 Test de vérification webhook:');
            console.log('  Pour tester complètement la configuration webhook:');
            console.log('  1. Utilisez Stripe CLI: stripe listen --forward-to localhost:5000/api/webhook');
            console.log('  2. Déclenchez un événement de test: stripe trigger payment_intent.succeeded');
            console.log('  3. Vérifiez les logs du serveur pour voir le traitement');
        } else {
            console.log('⚠️ STRIPE_WEBHOOK_SECRET n\'est pas définie - la vérification de signature ne fonctionnera pas');
            console.log('  Obtenez une clé secrète webhook depuis le dashboard Stripe ou avec Stripe CLI');
        }
        
        return true;
    } catch (error) {
        console.log(`❌ Erreur de configuration Stripe: ${error.message}`);
        return false;
    }
}

// Fonction principale
async function runDiagnostic() {
    console.log('🚀 DÉMARRAGE DU DIAGNOSTIC TROPITECH\n');
    
    const results = {};
    
    // Exécuter les vérifications
    results.env = await checkEnvVariables();
    results.dirs = await checkDirectories();
    results.mongodb = await testMongoDB();
    results.email = await testEmailService();
    results.pdf = await testPdfGeneration();
    results.stripe = await testStripeConfig();
    results.webhook = await testWebhookStructure();
    
    // Afficher le résumé
    console.log('\n=== RÉSUMÉ DU DIAGNOSTIC ===');
    
    for (const [test, result] of Object.entries(results)) {
        console.log(`${result ? '✅' : '❌'} ${test}`);
    }
    
    if (Object.values(results).every(result => result)) {
        console.log('\n✅ TOUS LES TESTS ONT RÉUSSI');
        console.log('Si vous rencontrez toujours des problèmes avec les webhooks, vérifiez:');
        console.log('1. L\'URL de webhook configurée dans le tableau de bord Stripe est correcte');
        console.log('2. Les logs du serveur pendant la réception d\'un webhook');
        console.log('3. Utilisez Stripe CLI pour envoyer des webhooks de test');
    } else {
        console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
        console.log('Corrigez les problèmes signalés puis relancez ce diagnostic');
    }
}

// Exécuter le diagnostic
runDiagnostic().catch(error => {
    console.error('❌ Erreur lors du diagnostic:', error);
    process.exit(1);
}).finally(() => {
    // Fermeture propre des connexions
    if (mongoose.connection.readyState !== 0) {
        mongoose.disconnect();
    }
});

// Fonction pour tester la structure du webhook
async function testWebhookStructure() {
    console.log('\n--- ANALYSE DE LA STRUCTURE DU WEBHOOK ---');
    
    try {
        // Chercher les fichiers pertinents
        const webHookRoutesPath = path.join(__dirname, '..', 'server', 'routes', 'webhookRoutes.js');
        const paymentRoutesPath = path.join(__dirname, '..', 'server', 'routes', 'paymentRoutes.js');
        const serverPath = path.join(__dirname, '..', 'server', 'server.js');
        
        let foundIssues = [];
        
        // Vérifier si les fichiers existent
        if (!fs.existsSync(webHookRoutesPath)) {
            foundIssues.push('❌ Fichier webhookRoutes.js non trouvé');
        } else {
            console.log('✅ Fichier webhookRoutes.js trouvé');
            
            // Analyser webhookRoutes.js
            const webhookContent = fs.readFileSync(webHookRoutesPath, 'utf8');
            
            if (!webhookContent.includes('express.raw')) {
                foundIssues.push('❌ webhookRoutes.js: Middleware raw non trouvé (express.raw)');
            } else {
                console.log('✅ webhookRoutes.js: Middleware raw trouvé');
            }
            
            if (!webhookContent.includes('stripe-signature')) {
                foundIssues.push('❌ webhookRoutes.js: Vérification de signature peut manquer (stripe-signature)');
            } else {
                console.log('✅ webhookRoutes.js: Référence à la signature trouvée');
            }
            
            if (!webhookContent.includes('payment_intent.succeeded')) {
                foundIssues.push('❌ webhookRoutes.js: Gestion de payment_intent.succeeded non trouvée');
            } else {
                console.log('✅ webhookRoutes.js: Gestion de payment_intent.succeeded trouvée');
            }
        }
        
        // Vérifier si paymentRoutes.js contient aussi des webhooks (confusion possible)
        if (fs.existsSync(paymentRoutesPath)) {
            const paymentContent = fs.readFileSync(paymentRoutesPath, 'utf8');
            
            if (paymentContent.includes('/webhook') && paymentContent.includes('express.raw')) {
                foundIssues.push('⚠️ paymentRoutes.js contient aussi un gestionnaire de webhook - risque de conflit');
            } else {
                console.log('✅ Pas de conflit avec paymentRoutes.js');
            }
        }
        
        // Vérifier la configuration dans server.js
        if (fs.existsSync(serverPath)) {
            const serverContent = fs.readFileSync(serverPath, 'utf8');
            
            // Chercher comment les routes sont montées
            if (serverContent.includes('app.use') && serverContent.includes('webhook')) {
                console.log('✅ Montage de routes webhook trouvé dans server.js');
                
                // Vérifier l'ordre du montage des routes
                const rawMiddlewarePattern = /app\.use\(\s*express\.json\(\)\s*\)/;
                const webhookMountPattern = /app\.use\([^)]*webhook[^)]*\)/;
                
                const rawMiddlewareMatch = serverContent.match(rawMiddlewarePattern);
                const webhookMountMatch = serverContent.match(webhookMountPattern);
                
                if (rawMiddlewareMatch && webhookMountMatch) {
                    const rawMiddlewarePos = rawMiddlewareMatch.index;
                    const webhookMountPos = webhookMountMatch.index;
                    
                    if (rawMiddlewarePos < webhookMountPos) {
                        foundIssues.push('❌ Problème critique: express.json() est monté AVANT les routes webhook');
                        foundIssues.push('  Le montage des routes webhook doit se faire avant le middleware JSON');
                    } else {
                        console.log('✅ Ordre correct: routes webhook montées avant middleware JSON');
                    }
                }
            } else {
                foundIssues.push('❌ Montage des routes webhook non trouvé dans server.js');
            }
        } else {
            foundIssues.push('❌ Fichier server.js non trouvé');
        }
        
        // Afficher les problèmes trouvés
        if (foundIssues.length > 0) {
            console.log('\n⚠️ Problèmes potentiels détectés:');
            foundIssues.forEach(issue => console.log(issue));
        } else {
            console.log('\n✅ Aucun problème structurel détecté dans les webhooks');
        }
        
        return foundIssues.length === 0;
    } catch (error) {
        console.log(`❌ Erreur d'analyse de webhook: ${error.message}`);
        return false;
    }
}