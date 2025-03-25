// server/utils/emailService.js
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Système simple de suivi des emails envoyés - en mémoire
// Remarque: Sera réinitialisé au redémarrage du serveur
const sentEmails = new Map();

/**
 * Envoie un email avec le billet en pièce jointe
 * @param {string} email - Email du destinataire
 * @param {string} name - Nom de l'utilisateur
 * @param {string} firstName - Prénom de l'utilisateur
 * @param {Object} ticketData - Données du billet (PDF, QR code, etc.)
 */
const sendTicketEmail = async (email, name, firstName, ticketData) => {
    try {
        console.log(`📧 Demande d'envoi du ticket à ${email}`);

        // Vérifier si un email a déjà été envoyé pour ce billet (via le chemin du fichier)
        const emailKey = `${email}-${ticketData.filePath}`;
        if (sentEmails.has(emailKey)) {
            const timeSent = sentEmails.get(emailKey);
            console.log(`⚠️ Un email a déjà été envoyé à ${email} avec ce ticket le ${timeSent}`);
            console.log(`⏭️ Évitement du duplicata d'email.`);
            return { messageId: "DUPLICATE_AVOIDED", status: "skipped" };
        }

        // Vérifier que les variables d'environnement sont définies
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("EMAIL_USER ou EMAIL_PASS non défini dans les variables d'environnement");
        }

        // Vérifier que ticketData contient les informations nécessaires
        if (!ticketData || !ticketData.filePath) {
            throw new Error(`Données de ticket invalides: ${JSON.stringify(ticketData)}`);
        }

        // Vérifier que le fichier PDF existe
        if (!fs.existsSync(ticketData.filePath)) {
            throw new Error(`Fichier PDF non trouvé: ${ticketData.filePath}`);
        }

        console.log(`✅ Fichier PDF vérifié: ${ticketData.filePath} (${fs.statSync(ticketData.filePath).size} bytes)`);

        let transporter;
        try {
            // Tenter d'utiliser la configuration sécurisée Gmail
            console.log(`🔄 Tentative de configuration du transporteur email avec Gmail (SSL)...`);
            transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",            // Préciser explicitement le serveur SMTP
                port: 465,                         // Port SMTP sécurisé
                secure: true,                      // Utiliser SSL/TLS
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,  // Utiliser un mot de passe d'application pour Gmail
                },
                debug: process.env.NODE_ENV !== 'production',
                logger: process.env.NODE_ENV !== 'production',
            });

            // Vérifier la connexion au service d'email
            await transporter.verify();
            console.log(`✅ Connexion au service d'email vérifiée (configuration Gmail)`);
        } catch (gmailError) {
            console.warn(`⚠️ Échec de la configuration Gmail, tentative de configuration générique: ${gmailError.message}`);
            
            // Si la première configuration échoue, essayer avec une configuration plus générique
            console.log(`🔄 Tentative de configuration alternative (service: "gmail")...`);
            transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            
            // Vérifier la connexion au service d'email
            await transporter.verify();
            console.log(`✅ Connexion au service d'email vérifiée (configuration générique)`);
        }

        // Nom du fichier pour la pièce jointe (sans le chemin complet)
        const attachmentFilename = `ticket_${firstName}_${name}.pdf`;
        console.log(`📎 Préparation de la pièce jointe: ${attachmentFilename}`);

        // Construire les options de l'email
        const mailOptions = {
            from: {
                name: 'Tropitech Event',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: "Votre billet pour Tropitech",
            text: `Bonjour ${firstName} ${name},\n\nVoici votre billet pour l'événement Tropitech.\n\nDate: 19 Avril 2025\nLieu: Caves du Château, Rue du Greny, Coppet\n\nMerci et à bientôt !\nL'équipe Tropitech`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f8f8f8; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #6200ea; margin-bottom: 10px;">Votre billet pour Tropitech</h1>
                        <div style="height: 3px; background: linear-gradient(to right, #6200ea, #b388ff); margin: 0 auto;"></div>
                    </div>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p>Bonjour <strong>${firstName} ${name}</strong>,</p>
                        <p>Nous vous remercions pour votre achat. Votre billet est joint à ce message.</p>
                        
                        <div style="background-color: #f0f0f0; padding: 15px; border-left: 4px solid #6200ea; margin: 15px 0;">
                            <p style="margin: 5px 0;"><strong>Date:</strong> 19 Avril 2025</p>
                            <p style="margin: 5px 0;"><strong>Heure:</strong> 20h00 - 04h00</p>
                            <p style="margin: 5px 0;"><strong>Lieu:</strong> Caves du Château, Rue du Greny, Coppet</p>
                            <p style="margin: 5px 0;"><strong>Transport:</strong> 3 min à pied de la gare de Coppet</p>
                        </div>
                        
                        <p>N'oubliez pas d'apporter une pièce d'identité. Votre billet sera scanné à l'entrée.</p>
                        <p>À très bientôt !</p>
                    </div>
                    
                    <div style="text-align: center; font-size: 12px; color: #666;">
                        <p>L'équipe Tropitech</p>
                        <p>Pour toute question, contactez-nous à <a href="mailto:etaris.collective@gmail.com" style="color: #6200ea;">etaris.collective@gmail.com</a></p>
                        <p>Suivez-nous sur <a href="https://www.instagram.com/tropi.tech?igsh=MXJnazQ5bXA0ejNxdA==" style="color: #6200ea;">Instagram</a></p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: attachmentFilename,
                    path: ticketData.filePath,
                    contentType: 'application/pdf'
                },
            ],
        };

        try {
            console.log(`📤 Tentative d'envoi d'email à ${email}...`);
            // Tenter d'envoyer l'email
            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Email envoyé à ${email}, ID: ${info.messageId}`);
            
            // Marquer cet email comme envoyé dans notre cache en mémoire
            sentEmails.set(emailKey, new Date().toISOString());
            
            return info;
        } catch (sendError) {
            console.error(`❌ Erreur lors de l'envoi de l'email:`, sendError);
            
            // Si l'envoi échoue, essayer à nouveau avec une configuration alternative
            if (sendError.message.includes('attachments')) {
                console.log(`⚠️ Problème avec la pièce jointe. Tentative d'envoi sans pièce jointe...`);
                delete mailOptions.attachments;
                mailOptions.html += `<p style="color: red; font-weight: bold;">Avertissement: en raison d'un problème technique, votre billet n'a pas pu être joint à cet email. Veuillez contacter le support à etaris.collective@gmail.com.</p>`;
                
                try {
                    const retryInfo = await transporter.sendMail(mailOptions);
                    console.log(`✅ Email envoyé sans pièce jointe à ${email}, ID: ${retryInfo.messageId}`);
                    
                    // Même sans pièce jointe, marquer comme envoyé pour éviter les duplicatas
                    sentEmails.set(emailKey, new Date().toISOString());
                    
                    return retryInfo;
                } catch (retryError) {
                    console.error(`❌ Échec de la seconde tentative:`, retryError);
                    throw retryError;
                }
            } else {
                throw sendError; // Propager l'erreur
            }
        }
    } catch (error) {
        console.error(`❌ Erreur lors de l'envoi du mail:`, error);
        console.error(`Stack trace:`, error.stack);
        throw error; // Propager l'erreur pour la traiter à un niveau supérieur
    }
};

// Fonction pour vérifier si un email a déjà été envoyé (pour utilisation externe)
const hasEmailBeenSent = (email, pdfPath) => {
    const emailKey = `${email}-${pdfPath}`;
    return sentEmails.has(emailKey);
};

// Exporter les fonctions
module.exports = { sendTicketEmail, hasEmailBeenSent };