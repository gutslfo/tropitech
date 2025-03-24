#!/bin/bash
# Script de démarrage du backend

echo "🚀 Démarrage du backend Tropitech..."

# Vérifier que MongoDB est accessible en utilisant seulement des commandes de base
echo "🔍 Vérification de l'environnement..."
counter=0
max_retries=30

echo "🔄 En attente de la connexion MongoDB..."
until (echo > /dev/tcp/mongo/27017) >/dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -ge $max_retries ]; then
        echo "❌ Impossible de se connecter à MongoDB après $max_retries tentatives."
        echo "🔍 Diagnostic réseau:"
        ping -c 3 mongo || echo "❌ Impossible de ping 'mongo'"
        exit 1
    fi
    echo "🔄 En attente de la connexion MongoDB..."
    sleep 2
done

echo "✅ Port MongoDB accessible avec succès!"

# Démarrer le serveur
echo "🚀 Démarrage du serveur Node.js..."
cd /app
exec node server/server.js