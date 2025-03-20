const Ticket = require("../models/ticket");
const fs = require("fs");
const QRCode = require("qrcode");

/**
 * Génère un billet PDF et un QR Code
 * @param {string} name - Nom de l'utilisateur
 * @param {string} firstName - Prénom de l'utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} paymentId - ID de paiement unique
 * @param {string} category - Catégorie du billet
 */
const generateTicketPDF = async (name, firstName, email, paymentId, category) => {
    try {
        console.log(`📄 Génération du billet pour ${email}`);

        const qrData = `https://tropitech.ch/ticket/${paymentId}`;
        const qrCodePath = `./qrcodes/qrcode_${paymentId}.png`;
        await QRCode.toFile(qrCodePath, qrData);

        const filePath = `./tickets/ticket_${firstName}_${name}.pdf`;

        // Simuler la génération d'un PDF (remplace avec une vraie lib comme PDFKit)
        fs.writeFileSync(filePath, `Billet de ${firstName} ${name} - ${category}`);

        console.log(`✅ Ticket généré: ${filePath}`);

        return { filePath, qrCodePath, qrData };
    } catch (error) {
        console.error(`❌ Erreur génération billet: ${error.message}`);
        throw error;
    }
};

module.exports = { generateTicketPDF };
