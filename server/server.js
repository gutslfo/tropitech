require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const connectDB = require("./config/db");
const paymentRoutes = require("./routes/paymentRoutes");
const ticketRoutes = require("./routes/ticketRoutes");

const app = express();

// 🔹 Sécurisation du serveur avec Helmet (protège contre certaines attaques)
app.use(helmet());

// 🔹 Activation de CORS pour autoriser le frontend à communiquer avec le backend
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));

// 🔹 Protection contre les attaques par force brute avec rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre de 15 minutes
});
app.use(limiter);

// 🔹 Journalisation des requêtes pour faciliter le debug
app.use(morgan("combined"));

// 🔹 Connexion à MongoDB
connectDB();

// 🔹 Gestion du JSON dans les requêtes
app.use(bodyParser.json());

// 🔹 Routes
app.use("/api/payment", paymentRoutes);
app.use("/api/ticket", ticketRoutes);

// 🔹 Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

// 🔹 Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
