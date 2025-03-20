const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const QRCode = require("qrcode");
const User = require("../models/User");
const Ticket = require("../models/ticket");
const { sendEmail } = require("../utils/emailService");


const router = express.Router();

// 🔹 Création de paiement sécurisé
router.post("/create-payment", async (req, res) => {
  try {
    const { amount, email, name, firstName, imageConsent } = req.body;

    if (!imageConsent) {
      return res.status(400).json({ error: "Vous devez accepter le droit à l'image" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "chf",
      receipt_email: email,
    });

    const user = new User({ email, name, firstName, paymentId: paymentIntent.id, imageConsent });
    await user.save();

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Erreur création paiement:", error);
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
});

// 🔹 Webhook sécurisé pour Stripe
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Erreur webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const email = paymentIntent.receipt_email;
    const paymentId = paymentIntent.id;

    const ticketExists = await Ticket.findOne({ paymentId });
    if (!ticketExists) {
      const ticket = new Ticket({ paymentId, email });
      await ticket.save();

      const qrData = `https://tropitech.ch/ticket/${paymentId}`;
      const qrCodeURL = await QRCode.toDataURL(qrData);

      sendEmail(email, qrCodeURL);
      console.log(`QR Code envoyé à ${email}`);
    }
  }

  res.sendStatus(200);
});

module.exports = router;
