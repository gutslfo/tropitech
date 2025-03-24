# Stage 1: Builder pour Node.js
FROM node:18-alpine AS builder

# Répertoire de travail
WORKDIR /app

# Installation de Python et des outils de build essentiels pour node-gyp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pixman-dev \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    fontconfig-dev \
    freetype-dev

# Créer un lien symbolique pour python
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Configurer npm pour utiliser python3
RUN npm config set python /usr/bin/python3

# Copier les fichiers package pour installer les dépendances
COPY package*.json ./

# Installer les dépendances avec des options explicites pour node-gyp
RUN npm install --python=/usr/bin/python3

# Copier le reste du code source
COPY . .

# Construire l'application Next.js
RUN npm run build

# Stage 2: Image de production
FROM node:18-alpine

# Répertoire de travail
WORKDIR /app

# Installation des dépendances runtime pour les modules compilés
RUN apk add --no-cache \
    python3 \
    pixman \
    cairo \
    pango \
    jpeg \
    giflib \
    fontconfig \
    freetype

# Créer un lien symbolique pour python (nécessaire pour certains scripts)
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Créer les dossiers nécessaires
RUN mkdir -p server/tickets server/qrcodes server/assets

# Copier les fichiers package et installer les dépendances de production
COPY package*.json ./
RUN npm config set python /usr/bin/python3 && \
    npm ci --only=production --python=/usr/bin/python3

# Copier les fichiers construits depuis l'étape builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/next.config.js ./next.config.js

# Configuration de l'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Exposer le port
EXPOSE ${PORT}

# Démarrer le serveur Node.js
CMD ["node", "server/server.js"]