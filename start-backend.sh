#!/bin/bash
# Script de démarrage du backend

echo "🚀 Démarrage du backend Tropitech..."

# Vérifier que MongoDB est accessible
echo "🔍 Vérification de l'environnement..."
counter=0
max_retries=30

echo "🔄 En attente de la connexion MongoDB..."
until nc -z mongo 27017; do
    counter=$((counter + 1))
    if [ $counter -ge $max_retries ]; then
        echo "❌ Impossible de se connecter à MongoDB après $max_retries tentatives."
        echo "🔍 Diagnostic réseau:"
        ping -c 3 mongo || echo "❌ Impossible de ping 'mongo'"
        exit 1
    fi
    echo "🔄 Tentative $counter/$max_retries. En attente de la connexion MongoDB..."
    sleep 2
done

echo "✅ Port MongoDB accessible avec succès!"

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

# Démarrer le serveur
echo "🚀 Démarrage du serveur Node.js..."
cd /app
exec node server/server.js