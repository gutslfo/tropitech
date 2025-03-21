# Stage 1: Build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install git to fetch code
RUN apk add --no-cache git python3 pkgconf pixman-dev cairo-dev pango-dev make g++
 
# Clone the latest code from the main branch
RUN git clone --depth 1 --branch main https://github.com/gutslfo/tropitech.git .

COPY .env .env

# Install dependencies and build
RUN npm install && npm install express mongoose cors dotenv helmet morgan body-parser nodemailer qrcode pdfkit express-rate-limit module-alias canvas && npm run build

# Stage 2: Production Image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app ./

COPY --from=builder /app/.env .env

# Expose port dynamically
ENV PORT=3000
EXPOSE ${PORT}

# Start the application
CMD ["npm", "start"]

