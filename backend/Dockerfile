# ── Build stage ──────────────────────────────────────────────────
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy rest of source
COPY . .

# Cloud Run provides PORT env variable
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]