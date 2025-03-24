# Dockerfile pour l'application Tropitech
FROM node:18-alpine AS builder

# Variables d'environnement pour la construction
ENV NODE_ENV=production
ENV PYTHON=/usr/bin/python3

# Installer les dépendances nécessaires pour Canvas et PDFKit
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    build-base

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste des fichiers
COPY . .

# Construire l'application Next.js
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Installer les dépendances de production pour Canvas et PDF
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    font-noto

# Variables d'environnement pour l'exécution
ENV NODE_ENV=production

# Créer un utilisateur non-root pour plus de sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Créer les dossiers nécessaires pour l'application
RUN mkdir -p /app/server/tickets /app/server/qrcodes /app/server/assets && \
    chown -R nextjs:nodejs /app

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires à l'exécution
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/server ./server
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Installer seulement les dépendances de production
RUN npm ci --omit=dev

# Changer pour l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Définir la commande pour démarrer l'application
CMD ["npm", "start"]