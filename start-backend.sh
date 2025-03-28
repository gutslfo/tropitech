#!/bin/bash
# Script de démarrage du backend

echo "🚀 Démarrage du backend Tropitech..."

# Vérifier que les dossiers requis existent
echo "🔍 Vérification des dossiers requis..."
for dir in /app/server/tickets /app/server/qrcodes /app/server/assets; do
    if [ ! -d "$dir" ]; then
        echo "📁 Création du dossier $dir"
        mkdir -p "$dir"
        chmod 755 "$dir"
    fi
    echo "✅ Dossier $dir prêt"
done

# Tester la connexion à MongoDB Atlas
echo "🔍 Test de connexion à MongoDB Atlas..."
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connexion à MongoDB Atlas réussie!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur de connexion MongoDB Atlas:', err);
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
    echo "❌ Erreur de connexion à MongoDB Atlas. Vérifiez l'URI et les informations d'identification."
    exit 1
fi

# Démarrer le serveur
echo "🚀 Démarrage du serveur Node.js..."
cd /app
exec node server/server.js