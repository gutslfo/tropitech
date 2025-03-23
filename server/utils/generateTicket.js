// server/utils/generateTicket.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { createCanvas, loadImage, registerFont } = require('canvas');

/**
 * Crée un QR Code stylisé avec les informations du billet
 * @param {string} firstName - Prénom de l'utilisateur
 * @param {string} lastName - Nom de l'utilisateur
 * @param {string} paymentId - ID de paiement unique
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
                const logoSize = 200;
                const logoX = (width - logoSize) / 2;
                const logoY = 10;
                ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            } else {
                console.log(`⚠️ Logo non trouvé à ${logoPath}, QR code généré sans logo`);
            }
        } catch (logoError) {
            console.error(`⚠️ Erreur lors du chargement du logo:`, logoError);
            // Continuer sans logo
        }
        
        // Ajouter le PRÉNOM au-dessus du QR code (en majuscules)
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        
        // Prénom au-dessus du QR code avec une police différente, plus élégante
        ctx.font = 'bold 80px Arial';
        ctx.fillText(firstName.toUpperCase(), width / 2, qrY - 40);
        
        // Nom en dessous du QR code avec la même police
        ctx.fillText(lastName.toUpperCase(), width / 2, qrY + 500 + 80);
        
        // Marque Tropitech en bas avec une police différente, plus distincte
        const customFontPath = path.join(__dirname, '..', 'assets', 'Barbra-Regular.ttf');  
        if (fs.existsSync(customFontPath)) {
            // Utilisation de registerFont au lieu de new Canvas.Font
            registerFont(customFontPath, { family: 'Barbra' });
            ctx.font = '200px Barbra'; // Utiliser la police Barbra avec une taille de 200px
        } else {
            console.error(`❌ Police Barbra non trouvée à ${customFontPath}, utilisation de la police par défaut.`);
            ctx.font = 'bold 200px Impact, fantasy'; // Fallback si la police Barbra est introuvable
        }
        ctx.fillText('TROPITECH', width / 2, height - 80);  
        
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
 * Génère un billet PDF minimaliste
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
        
        // Créer un nouveau document PDF avec design minimaliste
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
        
        // Fond noir pour un design minimaliste
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#000000');
        
        // Logo en haut (centré)
        try {
            const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
            if (fs.existsSync(logoPath)) {
                const logoWidth = 200;
                const logoX = (doc.page.width - logoWidth) / 2;
                doc.image(logoPath, logoX, 50, {
                    width: logoWidth
                });
                doc.moveDown(2);
            }
        } catch (logoError) {
            console.error(`❌ Erreur d'ajout du logo:`, logoError);
            // Continuer sans logo
        }

        // Ajouter le QR Code (élément central)
        try {
            const qrWidth = 300;
            const qrHeight = 300;
            const qrX = (doc.page.width - qrWidth) / 2;
            const qrY = 150; // Position fixe

            doc.image(qrCodePath, qrX, qrY, {
                width: qrWidth,
                height: qrHeight
            });
        } catch (imgError) {
            console.error(`❌ Erreur d'ajout du QR Code au PDF:`, imgError);
            doc.fillColor('#FFFFFF');
            doc.text('QR Code non disponible', { align: 'center' });
        }

        // Informations minimalistes sous le QR code
        doc.moveDown(4);
        doc.fontSize(14).fillColor('#FFFFFF');

        // Prénom et nom avec une police différente (plus élégante)
        doc.font('Helvetica-Bold').fontSize(24);
        doc.text(`${firstName.toUpperCase()} ${name.toUpperCase()}`, { align: 'center' });

        doc.moveDown(2);

        // Catégorie avec une couleur distinctive
        doc.font('Helvetica').fontSize(16);
        doc.fillColor('#FFD700'); // Or
        doc.text(category, { align: 'center' });

        doc.moveDown(2);

        // Détails de l'événement
        doc.fontSize(14).fillColor('#FFFFFF');
        doc.text('Date: 19 Avril 2025', { align: 'center' });
        doc.moveDown(0.5);
        doc.text('Lieu: Caves du Château, Rue du Greny, Coppet', { align: 'center' });
        doc.moveDown(2);
        
        // Notes
        doc.fontSize(12).fillColor('#AAAAAA');
        doc.text('Veuillez présenter ce billet à l\'entrée. Une pièce d\'identité pourra vous être demandée.', { align: 'center' });
        doc.moveDown(1);
        
        // ID unique
        doc.fontSize(8).fillColor('#666666');
        doc.text(`ID: ${paymentId}`, { align: 'center' });

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