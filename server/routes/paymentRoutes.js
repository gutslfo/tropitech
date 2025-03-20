require("dotenv").config();

// Affiche la clé Stripe utilisée
console.log("🔍 Clé Stripe utilisée :", process.env.STRIPE_SECRET_KEY);

const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const QRCode = require("qrcode"); // Garde QRCode si tu t'en sers ailleurs
const User = require("../models/User");
const Ticket = require("../models/ticket");
const { sendTicketEmail } = require("../utils/emailService");
const { generateTicketPDF } = require("../utils/generateTicket");

const router = express.Router();

console.log("✅ paymentRoutes chargé");

// ----------------------------------------------------
// Route GET de test
// ----------------------------------------------------
router.get("/", (req, res) => {
  console.log("✅ GET /api/payment");
  res.send("✅ API Stripe Payment OK");
});

// ----------------------------------------------------
// ROUTE : POST /create-payment
// Crée un PaymentIntent + enregistre un utilisateur en BDD
// ----------------------------------------------------
router.post("/create-payment", async (req, res) => {
  try {
    console.log("✅ POST /api/payment/create-payment appelé !");
    console.log("Body reçu:", req.body);

    const { amount, email, name, firstName, imageConsent } = req.body;

    // Vérification de base
    if (!imageConsent) {
      console.log("❌ L'utilisateur n'a pas coché le droit à l'image.");
      return res.status(400).json({ error: "Vous devez accepter le droit à l'image" });
    }

    // 1) Créer le PaymentIntent sur Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "chf",
      receipt_email: email,
    });
    console.log("✅ PaymentIntent créé :", paymentIntent.id);

    // 2) Créer l'utilisateur associé (pour rattacher le paymentId)
    const user = new User({
      email,
      name,
      firstName,
      paymentId: paymentIntent.id,
      imageConsent,
    });

    // Sauvegarde en base
    await user.save();
    console.log("✅ Utilisateur sauvegardé en base :", user);

    // 3) Répondre au front-end avec le client_secret pour finaliser le paiement
    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("❌ Erreur création paiement:", error);
    return res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
});

// ----------------------------------------------------
// ROUTE : POST /webhook
// Stripe envoie les événements (payment_intent.succeeded, etc.)
// ----------------------------------------------------
// IMPORTANT : on utilise express.raw({ type: "application/json" }) pour pouvoir valider la signature
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("📩 Webhook Stripe reçu !");

    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      // Vérification de la signature Stripe
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log("✅ Événement Stripe:", event.type);
    } catch (err) {
      console.error("❌ Erreur webhook (signature invalide) :", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gestion du type d'événement
    try {
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const paymentId = paymentIntent.id;
        const email = paymentIntent.receipt_email;

        console.log("✅ PaymentIntent succeeded :", paymentId, "Email :", email);

        // Vérifier si un ticket existe déjà
        const existingTicket = await Ticket.findOne({ paymentId });
        if (existingTicket) {
          console.log(`ℹ️ Un ticket existe déjà pour ce paiement: ${paymentId}`);
          return res.status(200).send("Ticket déjà existant.");
        }

        // Retrouver l'utilisateur en base
        const user = await User.findOne({ paymentId });
        if (!user) {
          console.log(`❌ Aucun user avec paymentId=${paymentId}. On arrête.`);
          // Tu peux créer l'user fictif ici si tu veux, ou juste sortir
          return res.status(200).send("Aucun user en base pour ce paymentId.");
        }

        // (Optionnel) : ici tu peux calculer la catégorie "thirdRelease" ou earlyBird, etc.
        // Forcé sur "thirdRelease" comme tu le faisais
        const category = "thirdRelease";

        // (Optionnel) : Enregistrer un ticket en base
        const newTicket = new Ticket({
          paymentId,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          category,
          imageConsent: user.imageConsent,
        });
        await newTicket.save();
        console.log(`✅ Ticket créé en base :`, newTicket);

        // Générer le PDF
        const ticketData = await generateTicketPDF(
          user.name,
          user.firstName,
          user.email,
          paymentId,
          category
        );

        // Envoyer l'email
        await sendTicketEmail(
          user.email,
          user.name,
          user.firstName,
          ticketData
        );
        console.log(`✅ Ticket PDF et email envoyés à ${user.email}`);
      }

      // Gérer d'autres events si besoin
      return res.status(200).send("OK");
    } catch (err) {
      console.error("❌ Erreur interne lors du traitement webhook:", err);
      return res.status(500).send("Erreur interne lors du traitement du webhook");
    }
  }
);

module.exports = router;
