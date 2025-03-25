// server/utils/dbConnect.js - Optimisé pour MongoDB Atlas
const mongoose = require('mongoose');

// Track connection state
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRIES = 5;

/**
 * Connect to MongoDB Atlas using a singleton pattern
 * @returns {Promise<typeof mongoose>} Mongoose connection
 */
const dbConnect = async () => {
  // Si déjà connecté, réutiliser la connexion
  if (isConnected) {
    console.log('📊 Utilisation de la connexion MongoDB Atlas existante');
    return mongoose;
  }

  // Vérifier que MONGO_URI est définie
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI n\'est pas définie dans les variables d\'environnement');
  }

  // Vérifier si l'URI commence par mongodb+srv:// (Atlas)
  const isAtlas = process.env.MONGO_URI.startsWith('mongodb+srv://');
  console.log(`🔄 Connexion à ${isAtlas ? 'MongoDB Atlas' : 'MongoDB'} en cours...`);

  try {
    // Si pas déjà connecté
    if (mongoose.connection.readyState !== 1) {
      // Options de connexion améliorées pour Atlas
      const options = {
        serverSelectionTimeoutMS: 10000, // 10s pour la sélection du serveur
        socketTimeoutMS: 45000, // 45s timeout pour les opérations
        family: 4, // Forcer IPv4
        retryWrites: true,
        w: 'majority', // Garantir que les écritures sont propagées à la majorité des serveurs
      };

      const db = await mongoose.connect(process.env.MONGO_URI, options);
      
      isConnected = true;
      connectionAttempts = 0; // Réinitialiser le compteur après une connexion réussie
      
      console.log(`✅ Connexion à ${isAtlas ? 'MongoDB Atlas' : 'MongoDB'} établie avec succès`);
      return db;
    } else {
      console.log('📊 MongoDB déjà connecté');
      isConnected = true;
      return mongoose;
    }
  } catch (error) {
    // Gestion améliorée des erreurs de connexion
    connectionAttempts++;
    
    console.error(`❌ Erreur de connexion à MongoDB (tentative ${connectionAttempts}/${MAX_RETRIES}):`, error.message);
    
    // Si l'erreur est liée à la sélection du serveur, détailler les problèmes possibles
    if (error.name === 'MongooseServerSelectionError') {
      console.error('⚠️ Problèmes possibles:');
      console.error('1. Vérifiez que votre chaîne de connexion est correcte');
      console.error('2. Vérifiez que votre adresse IP est autorisée dans Atlas');
      console.error('3. Vérifiez que les identifiants sont corrects');
      console.error('4. Vérifiez que le cluster Atlas est en ligne');
    }
    
    // Si nombre maximal de tentatives non atteint, réessayer
    if (connectionAttempts < MAX_RETRIES) {
      console.log(`⏱️ Nouvelle tentative dans ${connectionAttempts * 3} secondes...`);
      await new Promise(resolve => setTimeout(resolve, connectionAttempts * 3000));
      return dbConnect(); // Récursion pour réessayer
    }
    
    throw error; // Si max atteint, propager l'erreur
  }
};

// Exposer fonction pour vérifier l'état de connexion
dbConnect.isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Gestion améliorée des événements de connexion
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connecté à MongoDB Atlas');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Erreur de connexion Mongoose:', err.message);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('🟠 Mongoose déconnecté de MongoDB Atlas');
  isConnected = false;
});

// Gestion des reconnexions en cas de déconnexion inattendue
mongoose.connection.on('disconnected', async () => {
  if (!isConnected) return; // Éviter les tentatives de reconnexion redondantes
  
  console.log('🔄 Tentative de reconnexion à MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Reconnexion à MongoDB Atlas réussie');
    isConnected = true;
  } catch (error) {
    console.error('❌ Échec de reconnexion à MongoDB Atlas:', error.message);
    isConnected = false;
  }
});

// Gestion propre de la terminaison du processus
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB Atlas déconnecté proprement suite à l\'arrêt de l\'application');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de la fermeture de la connexion MongoDB:', err);
    process.exit(1);
  }
});

module.exports = dbConnect;