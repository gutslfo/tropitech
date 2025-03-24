#!/bin/bash
# Script pour démarrer tous les services Tropitech

echo "🚀 Démarrage de l'environnement Tropitech..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker et Docker Compose."
    exit 1
fi

# Vérifier si docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose."
    exit 1
fi

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo "⚠️ Fichier .env non trouvé. Création d'un exemple..."
    cat > .env << EOL
# Configuration MongoDB
MONGO_URI=mongodb://mongo:27017/tropitech

# Configuration Stripe
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Configuration Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# URLs
FRONTEND_URL=http://frontend:3000
CORS_ORIGIN=http://frontend:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
EOL
    echo "✅ Fichier .env d'exemple créé. Veuillez le modifier avec vos propres valeurs."
    echo "⚠️ L'application ne fonctionnera pas correctement sans configuration valide."
    read -p "Souhaitez-vous continuer quand même? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Arrêter les conteneurs existants proprement
echo "🔄 Arrêt des conteneurs existants..."
docker-compose down

# Construire les images
echo "🔄 Construction des images Docker..."
docker-compose build

# Démarrer les services
echo "🔄 Démarrage des services..."
docker-compose up -d

# Vérifier si les services sont démarrés correctement
echo "🔄 Vérification des services..."
sleep 5  # Attendre un peu que les services démarrent

if docker-compose ps | grep -q "tropitech-frontend.*Up"; then
    echo "✅ Frontend démarré avec succès"
else
    echo "❌ Le frontend n'a pas démarré correctement"
fi

if docker-compose ps | grep -q "tropitech-backend.*Up"; then
    echo "✅ Backend démarré avec succès"
else
    echo "❌ Le backend n'a pas démarré correctement"
fi

if docker-compose ps | grep -q "tropitech-mongo.*Up"; then
    echo "✅ MongoDB démarré avec succès"
else
    echo "❌ MongoDB n'a pas démarré correctement"
fi

echo
echo "📋 Statut des conteneurs:"
docker-compose ps

echo
echo "🌐 URLs importantes:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:5000"
echo "- API Santé: http://localhost:5000/health"

echo
echo "📝 Pour voir les logs:"
echo "- Tous les services: docker-compose logs -f"
echo "- Frontend uniquement: docker-compose logs -f frontend"
echo "- Backend uniquement: docker-compose logs -f backend"
echo "- MongoDB uniquement: docker-compose logs -f mongo"

echo
echo "✅ Démarrage terminé!"