// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import des routes
const ticketRoutes = require("./routes/ticketRoutes"); 
// Supposez que vous avez aussi paymentRoutes, etc.

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion MongoDB 
// (adaptez l'URI si besoin, vérifiez la variable d'env MONGO_URI)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

// Monte la route /api/ticket
app.use("/api/ticket", ticketRoutes);

// Ex: si vous avez /api/payment, vous faites:
// const paymentRoutes = require("./routes/paymentRoutes");
// app.use("/api/payment", paymentRoutes);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur Express en écoute sur http://localhost:${PORT}`);
});
