// server/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

// Import des routes
const ticketRoutes = require("./routes/ticketRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Vérifier les variables d'environnement essentielles
const requiredEnvVars = ['MONGO_URI', 'STRIPE_SECRET_KEY', 'EMAIL_USER', 'EMAIL_PASS'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`❌ Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`);
    console.error('Veuillez configurer ces variables dans votre fichier .env');
} else {
    console.log("✅ Variables d'environnement vérifiées");
}

// Créer les dossiers nécessaires s'ils n'existent pas
const dirs = [
    path.join(__dirname, 'tickets'),
    path.join(__dirname, 'qrcodes')
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
    next();
});

// Activer CORS
app.use(cors());

// Logger HTTP avec Morgan
app.use(morgan('dev'));

// ATTENTION: L'ordre est important ici!
// 1. D'abord la route webhook qui a besoin du corps brut
// IMPORTANT: La route /api/payment/webhook doit être configurée AVANT express.json middleware
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

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error(`❌ Erreur serveur:`, err);
    res.status(500).json({
        error: "Erreur interne du serveur",
        message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
    });
});

// Connexion à MongoDB et démarrage du serveur
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Connecté à MongoDB");
        
        // Démarrage du serveur après connexion à MongoDB
        app.listen(PORT, () => {
            console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
            console.log(`ℹ️ Webhooks Stripe disponibles sur http://localhost:${PORT}/api/payment/webhook`);
            console.log(`ℹ️ Pour utiliser ngrok: npx ngrok http ${PORT}`);
        });
    })
    .catch(err => {
        console.error("❌ Erreur de connexion à MongoDB:", err);
    });