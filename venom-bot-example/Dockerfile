# Multi-stage Docker build for production-ready Venom Bot

# Stage 1: Base image with dependencies
FROM node:18-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./

# Stage 2: Development dependencies
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Stage 3: Development environment
FROM base AS development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage 4: Production environment
FROM base AS production

# Install PM2 globally
RUN npm install -g pm2

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001 -G nodejs

# Change ownership and switch to non-root user
RUN chown -R botuser:nodejs /app
USER botuser

# Environment variables (with defaults)
ENV NODE_ENV=production
ENV BUSINESS_PHONE=""
ENV SUPABASE_URL="https://qtibjfewdkgjgmwojlta.supabase.co"
ENV SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aWJqZmV3ZGtnamdtd29qbHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTMzMzIsImV4cCI6MjA3MjY2OTMzMn0.7B7NwagU8pPs2BF32wAkxK6n92XpJsrR_sOfzzSCpgs"
ENV SESSION_NAME="mamaz-ai-bot"
ENV HEADLESS=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node healthcheck.js || exit 1

# Expose port (if needed for future web interface)
EXPOSE 3000

# Start with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]