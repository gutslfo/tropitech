const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  qrCodeScanned: { type: Boolean, default: false },
  email: { type: String, required: true },
});

module.exports = mongoose.model("Ticket", TicketSchema);

const express = require("express");
const Ticket = require("./ticket");

const router = express.Router();

// Endpoint pour récupérer le nombre de places restantes
router.get("/places-restantes", async (req, res) => {
  try {
    // Supposons qu'on ait une collection contenant le total de places
    const totalPlaces = 100; // Remplace par une valeur dynamique si stockée ailleurs

    const ticketsVendus = await Ticket.countDocuments();
    const placesRestantes = totalPlaces - ticketsVendus;

    res.json({ placesRestantes });
  } catch (error) {
    console.error("Erreur récupération places restantes:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

module.exports = router;
