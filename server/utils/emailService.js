// server/utils/emailService.js
const nodemailer = require("nodemailer");
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

        // Vérifier l'email du destinataire
        if (!email || !email.includes('@') || !email.includes('.')) {
            throw new Error(`Email destinataire invalide: ${email}`);
        }

        // Utiliser un transport SMTP correctement configuré pour Gmail
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",            // Préciser explicitement le serveur SMTP
            port: 465,                         // Port SMTP sécurisé
            secure: true,                      // Utiliser SSL/TLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,  // Utiliser un mot de passe d'application pour Gmail
            },
            // En production, désactiver le mode debug
            debug: process.env.NODE_ENV !== 'production',
            logger: process.env.NODE_ENV !== 'production',
        });

        // Vérifier la connexion au service d'email, puis envoyer avec une stratégie de retry
        let retries = 3;
        let success = false;
        let lastError = null;

        while (retries > 0 && !success) {
            try {
                // Vérifier d'abord la connexion
                await transporter.verify();
                console.log(`✅ Connexion au service d'email vérifiée`);
                
                // Taille du fichier PDF pour le diagnostic
                const stats = fs.statSync(ticketData.filePath);
                console.log(`📊 Taille du fichier PDF: ${stats.size} octets`);

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
                            filename: `ticket_${firstName}_${name}.pdf`,
                            path: ticketData.filePath,
                            contentType: 'application/pdf'
                        },
                    ],
                };

                // Envoyer l'email
                const info = await transporter.sendMail(mailOptions);
                console.log(`✅ Email envoyé à ${email}, ID: ${info.messageId}`);
                success = true;
                return info;
            } catch (err) {
                lastError = err;
                console.error(`⚠️ Erreur envoi email (tentatives restantes: ${retries-1}):`, err);
                retries--;
                
                // Attendre 2 secondes avant de réessayer
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        if (!success) {
            throw new Error(`Échec de l'envoi d'email après 3 tentatives: ${lastError?.message}`);
        }
    } catch (error) {
        console.error(`❌ Erreur lors de l'envoi du mail:`, error);
        console.error(error.stack);
        
        // Pour le débogage uniquement: journaliser l'état des fichiers
        try {
            if (ticketData && ticketData.filePath) {
                console.log(`📁 Vérification du fichier: ${ticketData.filePath}`);
                console.log(`📁 Le fichier existe: ${fs.existsSync(ticketData.filePath)}`);
                if (fs.existsSync(ticketData.filePath)) {
                    const stats = fs.statSync(ticketData.filePath);
                    console.log(`📁 Taille du fichier: ${stats.size} octets`);
                    console.log(`📁 Droits d'accès: ${stats.mode.toString(8)}`);
                }
            }
        } catch (fileError) {
            console.error(`❌ Erreur lors de la vérification des fichiers:`, fileError);
        }
        
        throw error; // Propager l'erreur pour la traiter à un niveau supérieur
    }
};

module.exports = { sendTicketEmail };