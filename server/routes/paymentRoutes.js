
require("dotenv").config();
console.log("🔍 Clé Stripe utilisée :", process.env.STRIPE_TEST_SECRET_KEY);

const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const QRCode = require("qrcode");
const User = require("../models/User");
const Ticket = require("../models/ticket");
const { sendTicketEmail } = require("../utils/emailService");
const { generateTicketPDF } = require("../utils/generateTicket");

const router = express.Router();
console.log("✅ Route POST /create-payment est bien définie");
console.log("✅ paymentRoutes chargé");

router.get("/", (req, res) => {
    res.send("✅ API Stripe Payment OK");
});

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
        console.error("❌ Erreur création paiement:", error);
        res.status(500).json({ error: "Erreur lors de la création du paiement" });
    }
});

router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error("❌ Erreur webhook:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const email = paymentIntent.receipt_email;
        const paymentId = paymentIntent.id;

        const ticketExists = await Ticket.findOne({ paymentId });
        if (!ticketExists) {
            const user = await User.findOne({ paymentId });

            if (user) {
                const ticketData = await generateTicketPDF(user.name, user.firstName, user.email, paymentId, "thirdRelease");
                await sendTicketEmail(user.email, user.name, user.firstName, ticketData);
                console.log(`✅ Ticket et email envoyés à ${user.email}`);
            }
        }
    }

    res.sendStatus(200);
});

module.exports = router;
