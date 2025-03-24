// scripts/reset-database.js
require('dotenv').config();
const mongoose = require('mongoose');

async function resetDatabase() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    // Vérifier que la variable d'environnement MONGO_URI est définie
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI n\'est pas définie dans le fichier .env');
    }
    
    // Se connecter à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Charger les modèles
    const Ticket = require('../server/models/ticket');
    const User = require('../server/models/User');
    
    // Compter les entrées avant la suppression
    const ticketCount = await Ticket.countDocuments();
    const userCount = await User.countDocuments();
    console.log(`📊 État actuel: ${ticketCount} tickets, ${userCount} utilisateurs`);
    
    // Demander confirmation
    console.log('\n⚠️ ATTENTION: Vous êtes sur le point de supprimer TOUTES les données de billets et d\'utilisateurs!');
    console.log('Cette action est IRRÉVERSIBLE et supprimera tous les billets vendus.\n');
    
    // Utiliser une fonction récursive pour éviter les problèmes avec process.stdin
    const confirm = () => {
      process.stdout.write('Tapez "RESET" pour confirmer la suppression: ');
      
      process.stdin.once('data', (data) => {
        const input = data.toString().trim();
        
        if (input === 'RESET') {
          resetCollections();
        } else {
          console.log('❌ Opération annulée. Les données n\'ont PAS été supprimées.');
          process.exit(0);
        }
      });
    };
    
    // Fonction pour réinitialiser les collections
    const resetCollections = async () => {
      try {
        // Supprimer les tickets
        console.log('🗑️ Suppression des tickets...');
        const ticketsResult = await Ticket.deleteMany({});
        
        // Supprimer les utilisateurs
        console.log('🗑️ Suppression des utilisateurs...');
        const usersResult = await User.deleteMany({});
        
        console.log(`✅ Réinitialisation terminée!`);
        console.log(`✅ ${ticketsResult.deletedCount} tickets supprimés.`);
        console.log(`✅ ${usersResult.deletedCount} utilisateurs supprimés.`);
        console.log('\n🎫 Le compteur Early Bird est maintenant réinitialisé à 30 places disponibles!');
        
        // Vérifier que tout est bien vide
        const ticketCountAfter = await Ticket.countDocuments();
        const userCountAfter = await User.countDocuments();
        console.log(`📊 État final: ${ticketCountAfter} tickets, ${userCountAfter} utilisateurs`);
        
        process.exit(0);
      } catch (resetError) {
        console.error('❌ Erreur lors de la réinitialisation des collections:', resetError);
        process.exit(1);
      }
    };
    
    // Lancer la confirmation
    confirm();
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

resetDatabase();