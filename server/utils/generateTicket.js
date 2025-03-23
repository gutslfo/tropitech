const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

/**
 * Crée un QR Code simple
 * @param {string} data - Données à encoder dans le QR code
 * @param {string} outputPath - Chemin de sortie du fichier
 * @returns {Promise<string>} - Chemin du fichier généré
 */
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