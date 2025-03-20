const { generateTicketPDF } = require("./generateTicket");
const Ticket = require("../models/ticket");
const nodemailer = require("nodemailer");

/**
 * Envoie un email avec le billet en pièce jointe
 * @param {string} email - Email du destinataire
 * @param {string} name - Nom de l'utilisateur
 * @param {string} firstName - Prénom de l'utilisateur
 * @param {Object} ticketData - Données du billet (PDF, QR code, etc.)
 */
const sendTicketEmail = async (email, name, firstName, ticketData) => {
    try {
        console.log(`📧 Envoi du ticket à ${email}`);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER, // => compte Gmail
                pass: process.env.EMAIL_PASS, // => mot de passe d’application
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Votre billet pour l'événement",
            text: `Bonjour ${firstName} ${name},\n\nVoici votre billet en pièce jointe.\n\nMerci et à bientôt !`,
            attachments: [
                {
                    filename: `ticket_${firstName}_${name}.pdf`,
                    path: ticketData.filePath,
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email envoyé à ${email}`);
    } catch (error) {
        console.error(`❌ Erreur lors de l'envoi du mail: ${error.message}`);
    }
};

module.exports = { sendTicketEmail };
