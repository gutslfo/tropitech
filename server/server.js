// server/server.js - Configuration corrigée
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");

// Import de l'utilitaire de connexion DB
const dbConnect = require("./utils/dbConnect");

// Import des routes
const ticketRoutes = require("./routes/ticketRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Vérifier les variables d'environnement essentielles
const requiredEnvVars = ['MONGO_URI', 'STRIPE_SECRET_KEY', 'EMAIL_USER', 'EMAIL_PASS', 'STRIPE_WEBHOOK_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`❌ Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`);
    console.error('Veuillez configurer ces variables dans votre fichier .env');
    process.exit(1); // Exit with error code
} else {
    console.log("✅ Variables d'environnement vérifiées");
}

// Sécurité avancée avec helmet
app.use(helmet());

// Créer les dossiers nécessaires s'ils n'existent pas
const dirs = [
    path.join(__dirname, 'tickets'),
    path.join(__dirname, 'qrcodes'),
    path.join(__dirname, 'assets')
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Dossier créé: ${dir}`);
    }
});

// Middleware de journalisation détaillée
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Log pour les webhooks
    if (req.url.includes('/webhook')) {
        console.log(`💡 Webhook détecté: ${req.url}`);
        console.log(`Content-Type: ${req.headers['content-type']}`);
    }
    
    next();
});

// Activer CORS avec des options sécurisées
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://tropitech.ch', 'https://www.tropitech.ch'] 
        : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
}));

// Logger HTTP avec Morgan
app.use(morgan('dev'));

// ⚠️ IMPORTANT: L'ORDRE EST CRITIQUE ICI ⚠️
// Les routes qui traitent les webhooks Stripe doivent être définies AVANT 
// le middleware express.json() car elles ont besoin du corps brut (Buffer)
// 1. Définir les routes des webhooks en premier (elles utilisent leur propre middleware express.raw)
app.use("/api/payment", paymentRoutes);

// 2. ENSUITE le middleware pour traiter le corps JSON et URL encoded pour les autres routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Routes qui utilisent le corps JSON parsé
app.use("/api/ticket", ticketRoutes);

// Route par défaut pour vérifier que le serveur fonctionne
app.get("/", (req, res) => {
    res.send("API Tropitech fonctionnelle!");
});

// Route de test pour les webhooks (pour vérifier la configuration)
app.post("/test-webhook", express.raw({type: 'application/json'}), (req, res) => {
    console.log("Test webhook endpoint hit!");
    console.log("Is req.body a Buffer?", Buffer.isBuffer(req.body));
    console.log("req.body length:", req.body.length);
    try {
        const jsonData = JSON.parse(req.body.toString());
        console.log("Parsed JSON:", jsonData);
        res.status(200).send({success: true, message: "Webhook test received successfully"});
    } catch (error) {
        console.error("Error parsing JSON:", error);
        res.status(400).send({success: false, error: "Invalid JSON"});
    }
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error(`❌ Erreur serveur:`, err);
    res.status(500).json({
        error: "Erreur interne du serveur",
        message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
    });
});

// Connexion à MongoDB et démarrage du serveur
const startServer = async () => {
    try {
        // Utiliser l'utilitaire de connexion DB
        await dbConnect();
        
        // Démarrage du serveur après connexion à MongoDB
        app.listen(PORT, () => {
            console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
            console.log(`ℹ️ Webhooks Stripe disponibles sur http://localhost:${PORT}/api/payment/webhook`);
            console.log(`ℹ️ Pour tester les webhooks: curl -X POST http://localhost:${PORT}/test-webhook -H "Content-Type: application/json" -d '{"test":"data"}'`);
            console.log(`ℹ️ Pour utiliser ngrok: npx ngrok http ${PORT}`);
        });
    } catch (err) {
        console.error("❌ Erreur de démarrage du serveur:", err);
        process.exit(1); // Exit with error code
    }
};

startServer();