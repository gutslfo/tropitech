// server/utils/generateTicket.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');

/**
 * Crée un QR Code stylisé avec le nom de l'utilisateur
 * @param {string} firstName - Prénom de l'utilisateur
 * @param {string} lastName - Nom de famille de l'utilisateur
 * @param {string} paymentId - ID du paiement pour le contenu du QR code
 * @param {string} outputPath - Chemin de sortie du fichier
 * @returns {Promise<string>} - Chemin du fichier généré
 */
const createStylishQRCode = async (firstName, lastName, paymentId, outputPath) => {
    try {
        // Données pour le QR code
        const qrData = `https://tropitech.ch/ticket/${paymentId}`;
        
        // Dimensions de l'image finale
        const width = 800;
        const height = 1200;
        
        // Créer un canvas
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Définir le fond noir
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        // Générer le QR code sur un canvas temporaire
        const qrCanvas = createCanvas(500, 500);
        await QRCode.toCanvas(qrCanvas, qrData, {
            errorCorrectionLevel: 'H', // Haut niveau de correction pour supporter le logo
            margin: 1,
            color: {
                dark: '#FFFFFF',  // QR code blanc
                light: '#000000'  // Fond noir
            },
            width: 500
        });
        
        // Position du QR code au centre
        const qrX = (width - 500) / 2;
        const qrY = (height - 500) / 2;
        
        // Dessiner le QR code sur le canvas principal
        ctx.drawImage(qrCanvas, qrX, qrY);
        
        try {
            // Charger et ajouter le logo au centre du QR code
            const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
            if (fs.existsSync(logoPath)) {
                const logo = await loadImage(logoPath);
                const logoSize = 120;
                const logoX = (width - logoSize) / 2;
                const logoY = (height - logoSize) / 2;
                ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            } else {
                console.log(`⚠️ Logo non trouvé à ${logoPath}, QR code généré sans logo`);
            }
        } catch (logoError) {
            console.error(`⚠️ Erreur lors du chargement du logo:`, logoError);
            // Continuer sans logo
        }
        
        // Ajouter le nom au-dessus et en dessous du QR code
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        
        // Prénom au-dessus du QR code
        ctx.font = 'bold 60px Arial';
        ctx.fillText(firstName.toUpperCase(), width / 2, qrY - 40);
        
        // Nom en dessous du QR code
        ctx.fillText(lastName.toUpperCase(), width / 2, qrY + 500 + 80);
        
        // Marque Tropitech en bas
        ctx.font = 'bold 80px Arial';
        ctx.fillText('TROPITECH', width / 2, height - 100);
        
        // Enregistrer l'image
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ QR code stylisé généré: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error(`❌ Erreur lors de la génération du QR code stylisé:`, error);
        throw error;
    }
};

/**
 * Génère un billet PDF et un QR Code
 * @param {string} name - Nom de l'utilisateur
 * @param {string} firstName - Prénom de l'utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} paymentId - ID de paiement unique
 * @param {string} category - Catégorie du billet
 * @returns {Promise<Object>} - Chemins des fichiers générés
 */
const generateTicketPDF = async (name, firstName, email, paymentId, category) => {
    try {
        console.log(`📄 Génération du billet pour ${email}`);
        
        // Créer les dossiers s'ils n'existent pas
        const qrDir = path.join(__dirname, '..', 'qrcodes');
        const ticketsDir = path.join(__dirname, '..', 'tickets');
        const assetsDir = path.join(__dirname, '..', 'assets');
        
        [qrDir, ticketsDir, assetsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`✅ Dossier créé: ${dir}`);
            }
        });
        
        // Chemin pour le QR code stylisé
        const qrCodePath = path.join(qrDir, `qrcode_${paymentId}.png`);
        
        // Générer le QR code stylisé
        await createStylishQRCode(firstName, name, paymentId, qrCodePath);
        
        // Chemin pour le fichier PDF
        const filePath = path.join(ticketsDir, `ticket_${firstName}_${name}.pdf`);
        
        // Créer un nouveau document PDF
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `Billet Tropitech - ${firstName} ${name}`,
                Author: 'Tropitech',
                Subject: 'Billet électronique',
            }
        });
        
        // Rediriger le document vers un fichier
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // Ajouter le contenu au PDF avec un design amélioré
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#111111');
        
        // Titre
        doc.font('Helvetica-Bold').fontSize(30).fillColor('#FFFFFF');
        doc.text('TROPITECH', { align: 'center' });
              
        doc.moveDown(2);
        
        // Infos utilisateur avec design amélioré
        const infoX = 100;
        const labelWidth = 120;
        
        doc.fontSize(12).fillColor('#FFFFFF');
        
        // Nom
        doc.text('NOM:', infoX, doc.y);
        doc.text(`${firstName} ${name}`, infoX + labelWidth, doc.y - doc.currentLineHeight());
        
        doc.moveDown(0.5);
        
        // Email
        doc.text('EMAIL:', infoX, doc.y);
        doc.text(email, infoX + labelWidth, doc.y - doc.currentLineHeight());
        
        doc.moveDown(0.5);
        
        // Catégorie
        doc.text('CATÉGORIE:', infoX, doc.y);
        doc.fillColor('#FFD700'); // Or pour la catégorie
        doc.text(category, infoX + labelWidth, doc.y - doc.currentLineHeight());
        doc.fillColor('#FFFFFF');
        
        doc.moveDown(0.5);
        
        // ID
        doc.text('ID:', infoX, doc.y);
        doc.text(paymentId, infoX + labelWidth, doc.y - doc.currentLineHeight());
        
        doc.moveDown(2);
        
        // Infos événement
        doc.fontSize(14).fillColor('#00FFFF'); // Bleu clair pour l'en-tête de l'événement
        doc.text('INFORMATIONS ÉVÉNEMENT', { align: 'center' });
        doc.moveDown(0.5);
        
        doc.fontSize(12).fillColor('#FFFFFF');
        doc.text('DATE:', infoX, doc.y);
        doc.text('19 Avril 2025', infoX + labelWidth, doc.y - doc.currentLineHeight());
        
        doc.moveDown(0.5);
        
        doc.text('LIEU:', infoX, doc.y);
        doc.text('Caves du Château, Rue du Greny, Coppet', infoX + labelWidth, doc.y - doc.currentLineHeight());
        
        doc.moveDown(3);
        
        // Ajouter le QR Code
        doc.fontSize(14).fillColor('#00FFFF');
        doc.text('PRÉSENTEZ CE QR CODE À L\'ENTRÉE', { align: 'center' });
        doc.moveDown(1);
        
        // Centrer le QR code
        try {
            const qrImage = doc.openImage(qrCodePath);
            const qrWidth = 300;
            const qrHeight = (qrWidth / qrImage.width) * qrImage.height;
            const qrX = (doc.page.width - qrWidth) / 2;
            
            doc.image(qrCodePath, qrX, doc.y, {
                width: qrWidth,
                height: qrHeight
            });
        } catch (imgError) {
            console.error(`❌ Erreur d'ajout du QR Code au PDF:`, imgError);
            doc.fillColor('#FFFFFF');
            doc.text('QR Code non disponible', { align: 'center' });
        }
        
        // Pied de page
        doc.fontSize(10).fillColor('#AAAAAA');
        doc.text('Tropitech © 2025 - Tous droits réservés', 50, doc.page.height - 50, { align: 'center' });
        
        // Finaliser le document
        doc.end();
        
        // Attendre que le stream soit terminé
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });
        
        console.log(`✅ Ticket PDF généré: ${filePath}`);
        
        return { 
            filePath, 
            qrCodePath, 
            qrData: `https://tropitech.ch/ticket/${paymentId}` 
        };
    } catch (error) {
        console.error(`❌ Erreur génération billet:`, error);
        console.error(error.stack);
        throw error;
    }
};

module.exports = { generateTicketPDF, createStylishQRCode };