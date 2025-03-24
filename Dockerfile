# Stage 1: Builder pour Node.js
FROM node:18-alpine AS builder

# Répertoire de travail
WORKDIR /app

# Installation des dépendances nécessaires pour canvas et la génération de PDF/QR code
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

# Définir python pour npm
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Copier les fichiers package pour installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le reste du code source
COPY . .

# Créer les dossiers nécessaires pour les tickets/QR codes
RUN mkdir -p server/tickets server/qrcodes server/assets

# Construire l'application Next.js
RUN npm run build
# Stage 2: Image de production
FROM node:18-alpine

# Répertoire de travail
WORKDIR /app

# Installation des dépendances runtime pour canvas
RUN apk add --no-cache \
    pixman \
    cairo \
    pango \
    jpeg \
    giflib \
    fontconfig \
    freetype \
    ttf-dejavu

# Créer les dossiers nécessaires
RUN mkdir -p server/tickets server/qrcodes server/assets

# Copier les fichiers package et installer les dépendances de production
COPY package*.json ./
RUN npm ci --only=production

# Copier les fichiers construits depuis l'étape builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/next.config.js ./next.config.js

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Définir les permissions pour les dossiers qui nécessitent un accès en écriture
RUN chown -R appuser:appgroup /app/server/tickets /app/server/qrcodes /app/server/assets
RUN chmod -R 755 /app/server/tickets /app/server/qrcodes /app/server/assets

# Configuration de l'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Exposer le port
EXPOSE ${PORT}

# Passer à l'utilisateur non-root
USER appuser

# Démarrer le serveur Node.js
CMD ["node", "server/server.js"]