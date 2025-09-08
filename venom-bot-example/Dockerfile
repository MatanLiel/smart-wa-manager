FROM node:18-slim

# Install system dependencies for Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Create non-root user
RUN groupadd -r botuser && useradd -r -g botuser -G audio,video botuser \
    && mkdir -p /app/tokens /app/logs \
    && chown -R botuser:botuser /app

# Copy package files
COPY package*.json ./

# Skip Chromium download during build to avoid timeout
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install dependencies with fallback for missing lockfile
RUN npm ci --omit=dev || (rm -f package-lock.json && npm install --omit=dev)

# Set npm config for reliability
RUN npm config set registry https://registry.npmjs.org/
RUN npm config set fetch-retries 3

# Set Puppeteer cache directory
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

# Copy app source
COPY . .

# Change ownership
RUN chown -R botuser:botuser /app

# Switch to non-root user
USER botuser

# Expose port (optional, for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node healthcheck.js

# Start the bot
CMD ["npm", "start"]