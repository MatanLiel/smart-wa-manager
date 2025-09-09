# Use Puppeteer base image with pre-installed Chrome
FROM ghcr.io/puppeteer/puppeteer:21.11.0

# Create app directory
WORKDIR /app

# Create non-root user matching puppeteer user
USER root
RUN mkdir -p /app/tokens /app/logs \
    && chown -R pptruser:pptruser /app

# Copy package files
COPY package*.json ./

# Skip Chromium download since it's already in base image
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Set npm config for reliability and speed
ENV NPM_CONFIG_FETCH_RETRIES=5
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000
ENV NPM_CONFIG_TIMEOUT=600000
RUN npm config set registry https://registry.npmjs.org/ && npm config set progress=false

# Install dependencies with fallback for missing lockfile
RUN npm ci --omit=dev --no-audit --no-fund || (rm -f package-lock.json && npm install --omit=dev --no-audit --no-fund)

# Copy app source
COPY . .

# Change ownership to puppeteer user
RUN chown -R pptruser:pptruser /app

# Switch to non-root user
USER pptruser

# Expose port (optional, for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node healthcheck.js

# Start the bot
CMD ["npm", "start"]