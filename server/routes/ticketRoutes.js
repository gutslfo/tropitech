// routes/ticketRoutes.js
const express = require("express");
const router = express.Router();
const Ticket = require("../models/ticket"); // ou le chemin vers votre modèle Mongoose

// Ex: définition du nombre total de places
const TOTAL_PLACES = {
  earlyBird: 30,
  secondRelease: 60,
  thirdRelease: 160,
};

// Route GET /api/ticket/places-restantes
router.get("/places-restantes", async (req, res) => {
  try {
    // Compter combien de tickets vendus par catégorie
    const earlyBirdSold = await Ticket.countDocuments({ category: "earlyBird" });
    const secondReleaseSold = await Ticket.countDocuments({ category: "secondRelease" });
    const thirdReleaseSold = await Ticket.countDocuments({ category: "thirdRelease" });

    // Calculer places restantes
    const placesRestantes = {
      earlyBird: Math.max(0, TOTAL_PLACES.earlyBird - earlyBirdSold),
      secondRelease: Math.max(0, TOTAL_PLACES.secondRelease - secondReleaseSold),
      thirdRelease: Math.max(0, TOTAL_PLACES.thirdRelease - thirdReleaseSold),
    };

    return res.json(placesRestantes);
  } catch (error) {
    console.error("Erreur récupération places restantes:", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Vous pouvez avoir d'autres routes ici : 
// ex: router.get("/:paymentId", ...), etc.

module.exports = router;
