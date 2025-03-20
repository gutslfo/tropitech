// server/utils/emailService.js
const nodemailer = require("nodemailer");
const { generateTicketPDF } = require("./generateTicket");
const fs = require("fs");
const path = require("path");

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

        // Vérifier que les variables d'environnement sont définies
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("EMAIL_USER ou EMAIL_PASS non défini dans les variables d'environnement");
        }

        // Vérifier que ticketData contient les informations nécessaires
        if (!ticketData || !ticketData.filePath || !fs.existsSync(ticketData.filePath)) {
            throw new Error(`Fichier PDF non trouvé: ${ticketData?.filePath}`);
        }

        // Créer le transporteur avec journalisation détaillée
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            debug: true, // Active la journalisation détaillée
            logger: true  // Active le logger pour voir les détails
        });

        // Vérifier la connexion au service d'email
        await transporter.verify();
        console.log(`✅ Connexion au service d'email vérifiée`);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Votre billet pour Tropitech",
            text: `Bonjour ${firstName} ${name},\n\nVoici votre billet pour l'événement Tropitech.\n\nDate: 19 Avril 2025\nLieu: Caves du Château, Rue du Greny, Coppet\n\nMerci et à bientôt !\nL'équipe Tropitech`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #6200ea;">Votre billet pour Tropitech</h2>
                    <p>Bonjour <strong>${firstName} ${name}</strong>,</p>
                    <p>Nous vous remercions pour votre achat. Votre billet est joint à ce message.</p>
                    <p>Date: <strong>19 Avril 2025</strong></p>
                    <p>Lieu: <strong>Caves du Château, Rue du Greny, Coppet</strong></p>
                    <p>À très bientôt !</p>
                    <p>L'équipe Tropitech</p>
                </div>
            `,
            attachments: [
                {
                    filename: `ticket_${firstName}_${name}.pdf`,
                    path: ticketData.filePath,
                    contentType: 'application/pdf'
                },
            ],
        };

        // Envoyer l'email
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email envoyé à ${email}, ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`❌ Erreur lors de l'envoi du mail:`, error);
        console.error(error.stack);
        throw error; // Propager l'erreur pour la traiter à un niveau supérieur
    }
};

module.exports = { sendTicketEmail };