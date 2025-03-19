const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { sendEmail } = require("../utils/emailService");
const Ticket = require("../models/Ticket");

const generateTicketPDF = async (name, firstName, email, paymentId) => {
    return new Promise(async (resolve, reject) => {
        const doc = new PDFDocument({ size: "A5", layout: "portrait" });
        const filePath = path.join(__dirname, `../tickets/ticket_${paymentId}.pdf`);
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);
        
        // Fond noir
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("black");
        
        // Ajout du logo
        const logoPath = path.join(__dirname, "../assets/logo.png");
        doc.image(logoPath, doc.page.width / 2 - 50, 20, { width: 100 });
        
        // Ajout du nom stylisé avec la police Barbra
        const barbraFont = path.join(__dirname, "../assets/fonts/Barbra.ttf");
        doc.registerFont("Barbra", barbraFont);
        doc.fillColor("white").font("Barbra").fontSize(24).text(name.toUpperCase(), { align: "center" });
        doc.fontSize(24).text(firstName.toUpperCase(), { align: "center" });
        
        // Génération et ajout du QR Code
        const qrData = `https://tropitech.ch/ticket/${paymentId}`;
        const qrCodeURL = await QRCode.toDataURL(qrData);
        const qrCodePath = path.join(__dirname, `../tickets/qrcode_${paymentId}.png`);
        fs.writeFileSync(qrCodePath, qrCodeURL.replace(/^data:image\/png;base64,/, ""), "base64");
        doc.image(qrCodePath, doc.page.width / 2 - 75, 150, { width: 150, height: 150 });
        
        // Ajout du branding Tropitech avec la police Brice SemiExpanded
        const briceFont = path.join(__dirname, "../assets/fonts/BriceSemiExpanded.ttf");
        doc.registerFont("Brice", briceFont);
        doc.font("Brice").fontSize(26).text("TROPITECH", { align: "center", baseline: "bottom" });
        
        doc.end();
        
        stream.on("finish", async () => {
            // Sauvegarde du ticket dans la base de données
            const ticket = new Ticket({ paymentId, email });
            await ticket.save();
            
            // Envoi de l'email avec le billet en pièce jointe
            await sendEmail(email, filePath);
            resolve(filePath);
        });
        stream.on("error", reject);
    });
};

module.exports = { generateTicketPDF };
