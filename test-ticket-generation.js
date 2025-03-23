// test-ticket-generation.js
// Placez ce fichier à la racine de votre projet et exécutez-le avec: node test-ticket-generation.js
require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');

// Path to your modules (adjust if needed)
const { generateTicketPDF } = require('./server/utils/generateTicket');
const { sendTicketEmail } = require('./server/utils/emailService');

// Dummy data for testing
const testData = {
  name: "Dupont",
  firstName: "Jean",
  email: process.env.EMAIL_USER || "votre-email@gmail.com", // Utilisez l'email dans .env ou remplacez
  paymentId: "test_payment_" + Date.now(), // ID unique
  category: "earlyBird"
};

// Function to test the entire process
async function testTicketGeneration() {
  console.log("🚀 Test de génération et envoi de ticket");
  console.log("📋 Données de test:", testData);

  try {
    // Step 1: Generate PDF ticket
    console.log("\n📄 Génération du PDF...");
    const ticketData = await generateTicketPDF(
      testData.name,
      testData.firstName,
      testData.email,
      testData.paymentId,
      testData.category
    );
    
    console.log("✅ PDF généré avec succès:");
    console.log(`- Chemin: ${ticketData.filePath}`);
    console.log(`- QR Code: ${ticketData.qrCodePath}`);
    
    // Check if files exist
    if (fs.existsSync(ticketData.filePath)) {
      const stats = fs.statSync(ticketData.filePath);
      console.log(`- Taille du PDF: ${stats.size} octets`);
    } else {
      console.error("❌ ERREUR: Le fichier PDF n'existe pas!");
    }
    
    if (fs.existsSync(ticketData.qrCodePath)) {
      const stats = fs.statSync(ticketData.qrCodePath);
      console.log(`- Taille du QR Code: ${stats.size} octets`);
    } else {
      console.log("ℹ️ Note: Le QR Code n'existe pas comme fichier séparé (il est intégré dans le PDF)");
    }

    // Step 2: Send email
    console.log("\n📧 Envoi de l'email avec le ticket...");
    const emailResult = await sendTicketEmail(
      testData.email,
      testData.name,
      testData.firstName,
      ticketData
    );
    
    console.log("✅ Email envoyé avec succès!");
    console.log(`- Destinataire: ${testData.email}`);
    console.log(`- ID Message: ${emailResult.messageId || "Non disponible"}`);
    
    console.log("\n🏁 Test terminé avec succès!");
    console.log("Vérifiez votre boîte de réception (et dossier spam) pour l'email contenant le ticket.");

  } catch (error) {
    console.error("\n❌ Erreur pendant le test:");
    console.error(error);
    
    // Give targeted advice based on the error
    if (error.message && error.message.includes('EAUTH')) {
      console.log("\n🔑 Problème d'authentification détecté:");
      console.log("1. Vérifiez que votre email et mot de passe sont corrects");
      console.log("2. Pour Gmail, activez la validation en 2 étapes puis créez un 'mot de passe d'application'");
      console.log("   à: https://myaccount.google.com/apppasswords");
    } else if (error.message && error.message.includes('ECONNREFUSED')) {
      console.log("\n🔌 Problème de connexion détecté:");
      console.log("1. Vérifiez votre connexion internet");
      console.log("2. Assurez-vous que le serveur SMTP n'est pas bloqué par un firewall");
    } else if (error.message && error.message.includes('PDF')) {
      console.log("\n📄 Problème de génération PDF détecté:");
      console.log("1. Vérifiez que les dossiers 'tickets' et 'qrcodes' existent");
      console.log("2. Assurez-vous que l'application a les droits d'écriture");
      console.log("3. Vérifiez que les dépendances comme 'pdfkit', 'canvas' sont installées");
    }
  } finally {
    process.exit(0);
  }
}

// Run the test
testTicketGeneration();