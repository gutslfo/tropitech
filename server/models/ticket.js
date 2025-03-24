const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  firstName: { type: String, required: true },
  qrCodeScanned: { type: Boolean, default: false },
  category: { 
    type: String, 
    required: true,
    enum: ["earlyBird", "secondRelease", "thirdRelease"] 
  },
  imageConsent: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Ticket", TicketSchema);