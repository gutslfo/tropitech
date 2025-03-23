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
        console.log(`🔄 Début de la génération du QR code stylisé pour ${firstName} ${lastName}`);
        
        // Vérifier que le dossier parent existe
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`✅ Dossier créé pour QR code: ${outputDir}`);
        }

        // Données pour le QR code
        const qrData = `https://tropitech.ch/ticket/${paymentId}`;
        console.log(`📊 Données du QR code: ${qrData}`);
        
        // Dimensions de l'image finale
        const width = 800;
        const height = 1200;
        
        // Créer un canvas
        console.log(`🔄 Création du canvas (${width}x${height})...`);
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Définir le fond noir
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        // Générer le QR code sur un canvas temporaire
        console.log(`🔄 Génération du QR code...`);
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
        console.log(`✅ QR code généré et positionné`);
        
        // Chemin du logo
        const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
        console.log(`🔍 Recherche du logo: ${logoPath}`);
        
        try {
            // Vérifier si le logo existe
            if (fs.existsSync(logoPath)) {
                console.log(`✅ Logo trouvé: ${logoPath}`);
                const logo = await loadImage(logoPath);
                const logoSize = 200;
                const logoX = (width - logoSize) / 2;
                const logoY = 10;
                ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
                console.log(`✅ Logo ajouté au QR code`);
            } else {
                // Si le logo n'existe pas, créer un logo de substitution
                console.log(`⚠️ Logo non trouvé à ${logoPath}, création d'un logo de substitution`);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 40px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('TROPITECH', width / 2, 100);
                
                // Créer le dossier assets s'il n'existe pas
                const assetsDir = path.join(__dirname, '..', 'assets');
                if (!fs.existsSync(assetsDir)) {
                    fs.mkdirSync(assetsDir, { recursive: true });
                    console.log(`✅ Dossier assets créé: ${assetsDir}`);
                }
                
                // Créer un logo de substitution simple
                const fallbackCanvas = createCanvas(200, 200);
                const fallbackCtx = fallbackCanvas.getContext('2d');
                fallbackCtx.fillStyle = '#333333';
                fallbackCtx.fillRect(0, 0, 200, 200);
                fallbackCtx.fillStyle = '#FFFFFF';
                fallbackCtx.font = 'bold 30px Arial';
                fallbackCtx.textAlign = 'center';
                fallbackCtx.fillText('TROPI', 100, 80);
                fallbackCtx.fillText('TECH', 100, 120);
                
                // Sauvegarder le logo de substitution
                const fallbackBuffer = fallbackCanvas.toBuffer('image/png');
                fs.writeFileSync(logoPath, fallbackBuffer);
                console.log(`✅ Logo de substitution créé et sauvegardé à ${logoPath}`);
            }
        } catch (logoError) {
            console.error(`⚠️ Erreur lors du chargement du logo:`, logoError);
            console.error(logoError.stack);
            // Continuer sans logo
        }
        
        // Ajouter le PRÉNOM au-dessus du QR code (en majuscules)
        console.log(`🔄 Ajout du texte...`);
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        
        // Prénom au-dessus du QR code avec une police différente, plus élégante
        ctx.font = 'bold 80px Arial';
        ctx.fillText(firstName.toUpperCase(), width / 2, qrY - 40);
        
        // Nom en dessous du QR code avec la même police
        ctx.fillText(lastName.toUpperCase(), width / 2, qrY + 500 + 80);
        
        // Marque Tropitech en bas avec une police différente, plus distincte
        const customFontPath = path.join(__dirname, '..', 'assets', 'Barbra-Regular.ttf');
        console.log(`🔍 Recherche de la police personnalisée: ${customFontPath}`);
        
        try {  
            if (fs.existsSync(customFontPath)) {
                console.log(`✅ Police Barbra trouvée: ${customFontPath}`);
                // Utilisation de registerFont au lieu de new Canvas.Font
                registerFont(customFontPath, { family: 'Barbra' });
                ctx.font = '200px Barbra'; // Utiliser la police Barbra avec une taille de 200px
                console.log(`✅ Police Barbra enregistrée et appliquée`);
            } else {
                console.log(`⚠️ Police Barbra non trouvée à ${customFontPath}, utilisation de la police par défaut.`);
                ctx.font = 'bold 200px Impact, fantasy'; // Fallback si la police Barbra est introuvable
            }
        } catch (fontError) {
            console.error(`⚠️ Erreur lors du chargement de la police:`, fontError);
            console.error(fontError.stack);
            ctx.font = 'bold 200px Impact, fantasy'; // Fallback en cas d'erreur
        }
        
        ctx.fillText('TROPITECH', width / 2, height - 80);  
        
        // Enregistrer l'image
        console.log(`🔄 Sauvegarde de l'image QR code vers ${outputPath}...`);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ QR code stylisé généré: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error(`❌ Erreur lors de la génération du QR code stylisé:`, error);
        console.error(error.stack);
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
        console.log(`📄 Début de la génération du billet PDF pour ${firstName} ${name} (${email})`);
        
        // Créer les dossiers s'ils n'existent pas
        const qrDir = path.join(__dirname, '..', 'qrcodes');
        const ticketsDir = path.join(__dirname, '..', 'tickets');
        const assetsDir = path.join(__dirname, '..', 'assets');
        
        [qrDir, ticketsDir, assetsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`✅ Dossier créé: ${dir}`);
            } else {
                console.log(`✅ Dossier existant vérifié: ${dir}`);
            }
        });
        
        // Générer un nom de fichier sécurisé
        const safeFileName = `${firstName}_${name}_${Date.now()}`.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
        console.log(`📝 Nom de fichier sécurisé généré: ${safeFileName}`);
        
        // Chemin pour le QR code stylisé
        const qrCodePath = path.join(qrDir, `qrcode_${safeFileName}.png`);
        console.log(`🔄 Chemin du QR code: ${qrCodePath}`);
        
        // Générer le QR code stylisé
        console.log(`🔄 Génération du QR code stylisé...`);
        await createStylishQRCode(firstName, name, paymentId, qrCodePath);
        console.log(`✅ QR code stylisé généré avec succès`);
        
        // Chemin pour le fichier PDF
        const filePath = path.join(ticketsDir, `ticket_${safeFileName}.pdf`);
        console.log(`🔄 Chemin du PDF à générer: ${filePath}`);
        
        // Créer un nouveau document PDF avec design minimaliste
        console.log(`🔄 Création du document PDF...`);
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
            console.log(`🔍 Recherche du logo pour le PDF: ${logoPath}`);
            
            if (fs.existsSync(logoPath)) {
                const logoWidth = 200;
                const logoX = (doc.page.width - logoWidth) / 2;
                doc.image(logoPath, logoX, 50, {
                    width: logoWidth
                });
                doc.moveDown(2);
                console.log(`✅ Logo ajouté au PDF`);
            } else {
                console.log(`⚠️ Logo non trouvé pour le PDF à ${logoPath}, création sans logo`);
            }
        } catch (logoError) {
            console.error(`❌ Erreur d'ajout du logo:`, logoError);
            console.error(logoError.stack);
            // Continuer sans logo
        }

        // Ajouter le QR Code (élément central)
        try {
            const qrWidth = 300;
            const qrHeight = 300;
            const qrX = (doc.page.width - qrWidth) / 2;
            const qrY = 150; // Position fixe

            if (fs.existsSync(qrCodePath)) {
                console.log(`✅ QR Code trouvé: ${qrCodePath}`);
                doc.image(qrCodePath, qrX, qrY, {
                    width: qrWidth,
                    height: qrHeight
                });
                console.log(`✅ QR Code ajouté au PDF`);
            } else {
                throw new Error(`QR Code non trouvé: ${qrCodePath}`);
            }
        } catch (imgError) {
            console.error(`❌ Erreur d'ajout du QR Code au PDF:`, imgError);
            console.error(imgError.stack);
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
        console.log(`🔄 Finalisation du document PDF...`);
        doc.end();
        
        // Attendre que le stream soit terminé
        console.log(`🔄 Attente de la fin de l'écriture du fichier...`);
        await new Promise((resolve, reject) => {
            stream.on('finish', () => {
                console.log(`✅ Écriture du fichier PDF terminée avec succès`);
                resolve();
            });
            stream.on('error', (error) => {
                console.error(`❌ Erreur lors de l'écriture du fichier PDF:`, error);
                reject(error);
            });
        });
        
        // Vérifier que le fichier a bien été créé
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`✅ Ticket PDF généré: ${filePath} (taille: ${stats.size} octets)`);
        } else {
            throw new Error(`Le fichier PDF n'a pas été créé: ${filePath}`);
        }
        
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