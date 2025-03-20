const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
    console.log("📩 Webhook Stripe reçu !");
    res.status(200).send("Webhook reçu");
});

module.exports = router;
