FROM node:20-slim

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libpango-1.0-0 libasound2 fonts-liberation ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# תלויות
COPY package*.json ./
RUN npm ci --omit=dev

# קוד
COPY . .

RUN mkdir -p /app/tokens /app/logs && chown -R node:node /app
USER node

# אם אין "start" ב-package.json של venom-bot-example,
# אפשר להחליף לשורה הבאה:
# CMD ["node","bot.js"]
CMD ["npm","start"]
