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
        
        // Dimensions de l'image finale (portrait pour ressembler à l'image de référence)
        const width = 800;
        const height = 1400;
        
        // Créer un canvas
        console.log(`🔄 Création du canvas (${width}x${height})...`);
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Définir le fond noir (comme sur l'image de référence)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        // Générer le QR code sur un canvas temporaire - plus grand que dans la version précédente
        console.log(`🔄 Génération du QR code...`);
        const qrSize = 600; // QR code plus grand pour être similaire à l'image
        const qrCanvas = createCanvas(qrSize, qrSize);
        await QRCode.toCanvas(qrCanvas, qrData, {
            errorCorrectionLevel: 'H', // Haut niveau de correction
            margin: 1,
            color: {
                dark: '#FFFFFF',  // QR code blanc
                light: '#000000'  // Fond noir
            },
            width: qrSize
        });
        
        // Position du QR code au centre
        const qrX = (width - qrSize) / 2;
        const qrY = (height - qrSize) / 2;
        
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
                const logoSize = 200; // Logo agrandi comme demandé
                const logoX = (width - logoSize) / 2;
                const logoY = 30; // Position montée encore plus haut comme demandé
                ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
                console.log(`✅ Logo ajouté au QR code`);
            } else {
                // Si le logo n'existe pas, créer un logo de substitution
                console.log(`⚠️ Logo non trouvé à ${logoPath}, création d'un logo de substitution`);
                
                // Créer un cercle coloré pour simuler le logo coloré de l'image de référence
                const centerX = width / 2;
                const centerY = 100;
                const radius = 75;
                
                // Créer un dégradé coloré pour simuler le logo coloré
                const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
                gradient.addColorStop(0, '#8A2BE2');  // Violet
                gradient.addColorStop(0.3, '#4B0082'); // Indigo
                gradient.addColorStop(0.6, '#00FF00'); // Vert vif
                gradient.addColorStop(1, '#9400D3');  // Violet foncé
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // Créer le dossier assets s'il n'existe pas
                const assetsDir = path.join(__dirname, '..', 'assets');
                if (!fs.existsSync(assetsDir)) {
                    fs.mkdirSync(assetsDir, { recursive: true });
                    console.log(`✅ Dossier assets créé: ${assetsDir}`);
                }
            }
        } catch (logoError) {
            console.error(`⚠️ Erreur lors du chargement du logo:`, logoError);
            console.error(logoError.stack);
            // Continuer sans logo
        }
        
        // Essayer de charger une police stylisée pour ressembler à celle de l'image
        try {
            const customFontPath = path.join(__dirname, '..', 'assets', 'Barbra-Regular.ttf');
            if (fs.existsSync(customFontPath)) {
                registerFont(customFontPath, { family: 'Barbra' });
                console.log('✅ Police Barbra chargée avec succès');
            }
        } catch (error) {
            console.error('⚠️ Erreur lors du chargement de la police:', error);
        }
        
        // Ajouter le PRÉNOM au-dessus du QR code, encore plus proche comme demandé
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.font = "bold 80px 'Barbra', Arial";
        ctx.fillText(firstName.toUpperCase(), width / 2, qrY - 40);
        
        // Ajouter le NOM en dessous du QR code (comme dans l'image de référence)
        ctx.font = "bold 80px 'Barbra', Arial";
        ctx.fillText(lastName.toUpperCase(), width / 2, qrY + qrSize + 100);
        
        // Suppression du texte TROPITECH comme demandé
        
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
            size: [595, 842], // A4 format in points
            margins: { top: 0, bottom: 0, left: 0, right: 0 }, // Pas de marges pour un design plein page
            info: {
                Title: `Billet Tropitech - ${firstName} ${name}`,
                Author: 'Tropitech',
                Subject: 'Billet électronique',
            }
        });
        
        // Rediriger le document vers un fichier
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // Créer un design minimaliste et élégant avec fond noir
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#000000');
        
        // Utiliser directement l'image du QR code comme page principale
        try {
            if (fs.existsSync(qrCodePath)) {
                // Adapter l'image au format PDF
                const pdfWidth = doc.page.width;
                const pdfHeight = doc.page.height;
                
                // Calculer les dimensions pour centrer l'image dans le PDF
                doc.image(qrCodePath, 0, 0, {
                    fit: [pdfWidth, pdfHeight],
                    align: 'center',
                    valign: 'center'
                });
                
                console.log(`✅ QR Code ajouté au PDF`);
            } else {
                throw new Error(`QR Code non trouvé: ${qrCodePath}`);
            }
        } catch (imgError) {
            console.error(`❌ Erreur d'ajout du QR Code au PDF:`, imgError);
            console.error(imgError.stack);
            
            // Si l'image ne peut pas être ajoutée, on crée un PDF simplifié
            doc.fillColor('#FFFFFF');
            doc.fontSize(24).text('TROPITECH', { align: 'center' });
            doc.moveDown(1);
            doc.fontSize(18).text(`${firstName.toUpperCase()} ${name.toUpperCase()}`, { align: 'center' });
            doc.moveDown(1);
            doc.fontSize(14).text('Ticket QR Code non disponible', { align: 'center' });
            doc.moveDown(1);
            doc.fontSize(10).text(`ID: ${paymentId}`, { align: 'center' });
        }
        
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