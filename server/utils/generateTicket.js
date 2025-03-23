const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
<<<<<<< HEAD
=======
const { createCanvas, loadImage, registerFont } = require('canvas');
>>>>>>> c153b443fc76e2b5684bdbf7b7de9c10326a18a1

/**
 * Crée un QR Code simple
 * @param {string} data - Données à encoder dans le QR code
 * @param {string} outputPath - Chemin de sortie du fichier
 * @returns {Promise<string>} - Chemin du fichier généré
 */
<<<<<<< HEAD
const createQRCode = async (data, outputPath) => {
  try {
    // Générer le QR code
    await QRCode.toFile(outputPath, data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',  // QR code noir
        light: '#FFFFFF'  // Fond blanc
      }
    });
    
    console.log(`✅ QR code généré: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`❌ Erreur lors de la génération du QR code:`, error);
    throw error;
  }
=======
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
            // Correction: Utilisation de registerFont au lieu de new Canvas.Font
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
>>>>>>> c153b443fc76e2b5684bdbf7b7de9c10326a18a1
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
    
    [qrDir, ticketsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Dossier créé: ${dir}`);
      }
    });
    
    // Chemins pour les fichiers
    const qrCodePath = path.join(qrDir, `qrcode_${paymentId}.png`);
    const filePath = path.join(ticketsDir, `ticket_${firstName}_${name}.pdf`);
    
    // Données pour le QR code
    const qrData = `https://tropitech.ch/ticket/${paymentId}`;
    
    // Générer le QR code
    await createQRCode(qrData, qrCodePath);
    
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
    
    // Fond noir
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#000000');
    
    // Titre
    doc.fontSize(24).fillColor('#FFFFFF');
    doc.text('TROPITECH', { align: 'center' });
    doc.moveDown(0.5);
    
    // Sous-titre
    doc.fontSize(16).fillColor('#FFFFFF');
    doc.text('BILLET ÉLECTRONIQUE', { align: 'center' });
    doc.moveDown(2);
    
    // Nom
    doc.font('Helvetica-Bold').fontSize(20);
    doc.text(`${firstName.toUpperCase()} ${name.toUpperCase()}`, { align: 'center' });
    doc.moveDown(1);
    
    // QR Code
    try {
<<<<<<< HEAD
      const qrSize = 200;
      const qrX = (doc.page.width - qrSize) / 2;
      doc.image(qrCodePath, qrX, doc.y, {
        width: qrSize,
      });
      doc.moveDown(3);
    } catch (imgError) {
      console.error(`❌ Erreur lors de l'ajout du QR Code au PDF:`, imgError);
      // Continuer sans QR code
      doc.text('QR Code non disponible', { align: 'center' });
      doc.moveDown(3);
=======
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
            const logoPath = path.join(__dirname, '..', 'assets', 'logo.png'); // Use a PNG file
            if (fs.existsSync(logoPath)) {
                const logoWidth = 500;
                const logoX = (doc.page.width - logoWidth) / 2;
                doc.image(logoPath, logoX, 50, {
                    width: logoWidth
                });
            }
        } catch (logoError) {
            console.error(`❌ Erreur d'ajout du logo:`, logoError);
            // Continue without the logo
        }

        // Add the QR Code (central element)
        try {
            const qrWidth = 150;
            const qrHeight = 150;
            const qrX = (doc.page.width - qrWidth) / 2;
            // Correction: utilisation de doc.page.height au lieu de height (variable non définie)
            const qrY = 150; // Position fixe au lieu de calculée

            doc.image(qrCodePath, qrX, qrY, {
                width: qrWidth,
                height: qrHeight
            });
        } catch (imgError) {
            console.error(`❌ Erreur d'ajout du QR Code au PDF:`, imgError);
            doc.fillColor('#FFFFFF');
            doc.text('QR Code non disponible', { align: 'center' });
        }

        // Minimalist information below the QR code
        doc.moveDown(2);
        doc.fontSize(14).fillColor('#FFFFFF');

        // First name and last name in a different font (more elegant)
        doc.font('Helvetica-Bold').fontSize(24);
        doc.text(`${firstName.toUpperCase()} ${name.toUpperCase()}`, { align: 'center' });

        doc.moveDown(4);

        // Category in a distinctive color
        doc.font('Helvetica').fontSize(16);
        doc.fillColor('#FFD700'); // Gold
        doc.text(category, { align: 'center' });

        doc.moveDown(3);

        // "TROPITECH" in large font at the bottom with custom font
        const customFontPath = path.join(__dirname, '..', 'assets', 'Barbra-Regular.ttf');
        if (fs.existsSync(customFontPath)) {
            console.log(`✅ Police personnalisée trouvée: ${customFontPath}`);
            doc.registerFont('BarbraRegular', customFontPath);
            doc.font('BarbraRegular').fontSize(48).fillColor('#FFFFFF');
        } else {
            console.error(`❌ Police personnalisée non trouvée à ${customFontPath}, utilisation de la police par défaut.`);
            doc.font('Times-Bold').fontSize(48).fillColor('#FFFFFF');
        }
        doc.text('TROPITECH', 50, doc.page.height - 100, { align: 'center' });
        
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
>>>>>>> c153b443fc76e2b5684bdbf7b7de9c10326a18a1
    }
    
    // Catégorie
    doc.fontSize(16).fillColor('#FFD700'); // Or
    doc.text(`Catégorie: ${category}`, { align: 'center' });
    doc.moveDown(1);
    
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
      qrData 
    };
  } catch (error) {
    console.error(`❌ Erreur génération billet:`, error);
    console.error(error.stack);
    throw error;
  }
};

module.exports = { generateTicketPDF, createQRCode };