// server/server.js - Configuration mise à jour
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
const webhookRoutes = require("./routes/webhookRoutes");

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

// Configuration CORS améliorée pour la communication avec le frontend
const corsOptions = {
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
    credentials: true
};

// Pour le développement, permettre plusieurs origines
if (process.env.NODE_ENV !== 'production') {
    const allowedOrigins = ['http://localhost:3000', 'http://frontend:3000'];
    corsOptions.origin = (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    };
    console.log('⚠️ Mode développement: CORS configuré pour permettre plusieurs origines');
}

// Activer CORS avec les options
app.use(cors(corsOptions));
console.log(`✅ CORS configuré pour: ${corsOptions.origin}`);

// Logger HTTP avec Morgan
app.use(morgan('dev'));

// ⚠️ IMPORTANT: L'ORDRE EST CRITIQUE ICI ⚠️
// Les routes qui traitent les webhooks Stripe doivent être définies AVANT 
// le middleware express.json() car elles ont besoin du corps brut (Buffer)

// 1. Monter les routes webhook
app.use("/api/webhook", webhookRoutes);

// 2. ENSUITE le middleware pour traiter le corps JSON et URL encoded pour les autres routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Routes qui utilisent le corps JSON parsé
app.use("/api/ticket", ticketRoutes);

// Route par défaut pour vérifier que le serveur fonctionne
app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "API Tropitech opérationnelle",
        version: "1.0.0",
        env: process.env.NODE_ENV,
        serverTime: new Date().toISOString()
    });
});

// Route de santé pour vérifier les dépendances critiques
app.get("/health", async (req, res) => {
    try {
        const health = {
            uptime: process.uptime(),
            timestamp: Date.now(),
            mongodb: false,
            email: false,
            directories: {
                tickets: fs.existsSync(path.join(__dirname, 'tickets')),
                qrcodes: fs.existsSync(path.join(__dirname, 'qrcodes')),
                assets: fs.existsSync(path.join(__dirname, 'assets'))
            }
        };

        // Vérifier la connexion MongoDB
        try {
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState === 1) {
                health.mongodb = true;
            } else {
                health.mongodb = false;
            }
        } catch (error) {
            health.mongodb = false;
        }

        // Vérifier email creds existent
        health.email = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

        // Vérifier que le logo existe
        const logoPath = path.join(__dirname, 'assets', 'logo.png');
        health.logo_exists = fs.existsSync(logoPath);

        // Renvoyer le statut
        const healthStatus = health.mongodb && health.email && 
                             health.directories.tickets && 
                             health.directories.qrcodes && 
                             health.directories.assets && 
                             health.logo_exists;

        res.status(healthStatus ? 200 : 503).json(health);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
            console.log(`✅ Serveur backend démarré sur http://localhost:${PORT}`);
            console.log(`ℹ️ Webhooks Stripe disponibles sur http://localhost:${PORT}/api/webhook`);
            console.log(`ℹ️ Frontend attendu sur: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
        });
    } catch (err) {
        console.error("❌ Erreur de démarrage du serveur:", err);
        process.exit(1); // Exit with error code
    }
};

startServer();