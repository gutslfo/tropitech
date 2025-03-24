// test-email.js
// Créez ce fichier à la racine de votre projet et exécutez-le avec: node test-email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log("🧪 Test d'envoi d'email");
  console.log("📋 Configuration:");
  console.log(`- Email utilisateur: ${process.env.EMAIL_USER ? '✓ Défini' : '❌ Non défini'}`);
  console.log(`- Mot de passe email: ${process.env.EMAIL_PASS ? '✓ Défini' : '❌ Non défini'}`);

  // Vérification des variables d'environnement
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ EMAIL_USER ou EMAIL_PASS non défini dans le fichier .env");
    console.log("Créez un fichier .env à la racine avec:");
    console.log("EMAIL_USER=votre_email@gmail.com");
    console.log("EMAIL_PASS=votre_mot_de_passe_d_application");
    return;
  }

  try {
    // Création du transporteur
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      debug: true, // Activer les logs détaillés
    });

    // Vérification de la connexion
    console.log("🔄 Vérification de la connexion au service d'email...");
    await transporter.verify();
    console.log("✅ Connexion au service d'email réussie");

    // Envoi d'un email de test
    const info = await transporter.sendMail({
      from: {
        name: 'Test Tropitech',
        address: process.env.EMAIL_USER
      },
      to: process.env.EMAIL_USER, // Envoi à soi-même pour le test
      subject: "Test d'envoi d'email Tropitech",
      text: "Ceci est un email de test pour vérifier la configuration d'envoi d'email.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #6200ea;">Test d'envoi d'email Tropitech</h2>
          <p>Ceci est un email de test pour vérifier que la configuration d'envoi fonctionne correctement.</p>
          <p>Date et heure d'envoi: ${new Date().toLocaleString()}</p>
          <p>Si vous recevez cet email, la configuration est correcte! 🎉</p>
        </div>
      `
    });

    console.log("✅ Email de test envoyé avec succès:");
    console.log(`- ID du message: ${info.messageId}`);
    console.log(`- URL de prévisualisation: ${nodemailer.getTestMessageUrl(info)}`);
    console.log(`- Envoyé à: ${process.env.EMAIL_USER}`);
    
    console.log("\n📝 Étapes suivantes:");
    console.log("1. Vérifiez votre boîte de réception ET vos dossiers spam/indésirables");
    console.log("2. Si vous ne recevez pas l'email, vérifiez que votre compte Gmail autorise les 'applications moins sécurisées'");
    console.log("   ou utilisez un mot de passe d'application: https://myaccount.google.com/apppasswords");

  } catch (error) {
    console.error("❌ Erreur lors du test d'envoi d'email:");
    console.error(error);
    
    if (error.code === 'EAUTH') {
      console.log("\n🔑 Problème d'authentification détecté:");
      console.log("1. Vérifiez que votre email et mot de passe sont corrects");
      console.log("2. Pour Gmail, activez la validation en 2 étapes puis créez un 'mot de passe d'application'");
      console.log("   à: https://myaccount.google.com/apppasswords");
      console.log("3. Utilisez ce mot de passe d'application comme EMAIL_PASS dans votre .env");
    }
  }
}

testEmail();