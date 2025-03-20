require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const paymentRoutes = require("./routes/paymentRoutes");
const ticketRoutes = require("./routes/ticketRoutes");

const app = express();

require("dotenv").config();
console.log("🔍 Vérification ENV:");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ OK" : "❌ Manquant !");
console.log("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "✅ OK" : "❌ Manquant !");


// 🔹 Sécurité avec Helmet
app.use(helmet());

// 🔹 Activer CORS pour que Next.js puisse appeler Express
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));

// 🔹 Logs des requêtes
app.use(morgan("combined"));

// 🔹 Connexion MongoDB
connectDB();

// 🔹 Gérer le JSON (Attention : Stripe Webhook nécessite du `raw` !)
app.use(bodyParser.json());

// 🔹 Routes API
app.use("/api/payment", paymentRoutes);
app.use("/api/ticket", ticketRoutes);

// 🔹 Webhook Stripe (⚠️ Besoin de `raw` pour la validation des signatures)
app.use("/api/webhook", express.raw({ type: "application/json" }), require("./routes/webhookRoutes"));

// 🔹 Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

// 🔹 Lancer le serveur Express sur un port différent de Next.js
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur Express sur http://localhost:${PORT}`));
