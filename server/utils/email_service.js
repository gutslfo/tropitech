const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const eventDetails = {
  name: "Tropitech",
  date: "19/04/25",
  location: "Caves du Château de Coppet",
};

const sendEmail = async (to, qrData, name, eventDetails) => {
    try {
        // 🔹 Générer le QR Code en base64
        const qrCodePath = path.join(__dirname, "temp_qr.png");
        await QRCode.toFile(qrCodePath, qrData);

        // 🔹 Générer un PDF du billet
        const pdfPath = path.join(__dirname, "temp_ticket.pdf");
        await generateTicketPDF(pdfPath, qrCodePath, name, eventDetails);

        // 🔹 Configuration du transporteur d'email
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 🔹 Contenu de l'email
        let mailOptions = {
            from: '"Événement" <no-reply@tropitech.ch>',
            to,
            subject: "🎟️ Votre billet Tropitech",
            html: `
                <p>Bonjour <strong>${name}</strong>,</p>
                <p>Thank you for your participation! We can't wait to see you. Please find the ticket for  <strong>${eventDetails.name}</strong> below.</p>
                <p>Date : <strong>${eventDetails.date}</strong></p>
                <p>Lieu : <strong>${eventDetails.location}</strong></p>
                <p>Please present this QR code upon entrance :</p>
                <p><img src="cid:qrCode" alt="QR Code" /></p>
                <p>📎 Your ticket is also attached to this mail (PDF).</p>
                <p>See you in the jungle!</p>`,
            attachments: [
                {
                    filename: "ticket.pdf",
                    path: pdfPath,
                },
                {
                    filename: "qrcode.png",
                    path: qrCodePath,
                    cid: "qrCode", // Permet d'afficher le QR dans l'email
                },
            ],
        };

        // 🔹 Envoyer l'email
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email envoyé à ${to}`);

        // 🔹 Supprimer les fichiers temporaires
        fs.unlinkSync(qrCodePath);
        fs.unlinkSync(pdfPath);
    } catch (error) {
        console.error("❌ Erreur envoi email :", error);
    }
};

// 🔹 Fonction pour générer le PDF du billet
const generateTicketPDF = (pdfPath, qrCodePath, name, eventDetails) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(pdfPath);

        doc.pipe(stream);

        // 🔹 Titre
        doc.fontSize(20).text("🎟️ Billet d'entrée", { align: "center" }).moveDown();
        
        // 🔹 Infos sur l'événement
        doc.fontSize(14).text(`Événement : ${eventDetails.name}`);
        doc.text(`Date : ${eventDetails.date}`);
        doc.text(`Lieu : ${eventDetails.location}`).moveDown();

        // 🔹 Nom du participant
        doc.fontSize(16).text(`🎫 Billet pour : ${name}`).moveDown();

        // 🔹 QR Code
        doc.image(qrCodePath, { fit: [150, 150], align: "center" });

        // 🔹 Infos supplémentaires
        doc.moveDown().fontSize(12).text("Please present this ticket upon entrance");
        doc.text("This ticket is nominative et non trasnferable.");
        doc.text("Cheers, see you soon!");

        doc.end();
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
};

module.exports = { sendEmail };
