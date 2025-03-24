FROM node:18-alpine

# Variables d'environnement
ENV NODE_ENV=production
ENV PYTHON=/usr/bin/python3

# Installer les dépendances nécessaires
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

# Définir le répertoire de travail
WORKDIR /app

# Copier tous les fichiers de l'application
COPY . .

# Installer les dépendances
RUN npm ci

# Créer les dossiers nécessaires s'ils n'existent pas
RUN mkdir -p /app/server/tickets /app/server/qrcodes /app/server/assets

# Exposer le port
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "start"]