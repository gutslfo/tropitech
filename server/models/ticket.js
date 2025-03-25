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
  // Nouveaux champs pour le suivi des emails
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date, default: null },
  emailAttempts: { type: Number, default: 0 },
  emailMessageId: { type: String },
  emailError: { type: String },
  // Chemin du PDF généré
  pdfPath: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Ajouter des index pour optimiser les recherches
TicketSchema.index({ email: 1 });
TicketSchema.index({ paymentId: 1 }, { unique: true });
TicketSchema.index({ qrCodeScanned: 1 });

module.exports = mongoose.model("Ticket", TicketSchema);