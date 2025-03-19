const express = require("express");
const Ticket = require("../models/ticket");

const router = express.Router();

// 🔹 Configuration du nombre de places par catégorie
const TOTAL_PLACES = {
    earlyBird: 30,
    secondRelease: 60,
    thirdRelease: 160,
};

// 🔹 Route pour récupérer le nombre de places restantes par catégorie
router.get("/places-restantes", async (req, res) => {
    try {
        // Comptabilisation des billets vendus par catégorie
        const earlyBirdSold = await Ticket.countDocuments({ category: "earlyBird" });
        const secondReleaseSold = await Ticket.countDocuments({ category: "secondRelease" });
        const thirdReleaseSold = await Ticket.countDocuments({ category: "thirdRelease" });

        // Calcul des places restantes
        const placesRestantes = {
            earlyBird: Math.max(0, TOTAL_PLACES.earlyBird - earlyBirdSold),
            secondRelease: Math.max(0, TOTAL_PLACES.secondRelease - secondReleaseSold),
            thirdRelease: Math.max(0, TOTAL_PLACES.thirdRelease - thirdReleaseSold),
        };

        res.json(placesRestantes);
    } catch (error) {
        console.error("Erreur récupération places restantes:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// 🔹 Route pour vérifier le statut d’un ticket via son paymentId
router.get("/:paymentId", async (req, res) => {
    try {
        const { paymentId } = req.params;

        const ticket = await Ticket.findOne({ paymentId });
        if (!ticket) return res.status(404).json({ error: "Ticket non trouvé" });

        res.json({ 
            status: ticket.qrCodeScanned ? "QR Code déjà scanné" : "QR Code valide",
            email: ticket.email,
            category: ticket.category
        });
    } catch (error) {
        console.error("Erreur lors de la récupération du ticket:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// 🔹 Route pour valider/scanner un ticket
router.post("/scan/:paymentId", async (req, res) => {
    try {
        const { paymentId } = req.params;

        const ticket = await Ticket.findOne({ paymentId });
        if (!ticket) return res.status(404).json({ error: "Ticket non trouvé" });

        if (ticket.qrCodeScanned) {
            return res.status(400).json({ error: "Ce ticket a déjà été scanné" });
        }

        ticket.qrCodeScanned = true;
        await ticket.save();

        res.json({ message: "Ticket validé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la validation du ticket:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

module.exports = router;
