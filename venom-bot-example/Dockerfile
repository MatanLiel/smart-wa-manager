# Use Node 20 (has built-in fetch/File APIs needed by undici)
FROM node:20-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# Chromium + required system deps for venom-bot/puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libpango-1.0-0 libasound2 fonts-liberation ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Runtime env
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
# Prefer npm ci when lockfile exists; fallback to install
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

# Folders used by the app
RUN mkdir -p /app/tokens /app/logs

EXPOSE 3000

CMD ["npm", "start"]
