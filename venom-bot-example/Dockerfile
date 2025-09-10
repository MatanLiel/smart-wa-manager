FROM node:20-slim

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libpango-1.0-0 libasound2 fonts-liberation ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
# לא להוריד Chromium בזמן npm i (אנחנו משתמשים בכרומיום של המערכת)
ENV PUPPETEER_SKIP_DOWNLOAD=true
# הנתיב ל-Chromium במערכת
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# תלויות קודם; אם יש lockfile נשתמש ב-npm ci, אחרת npm install
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# קוד האפליקציה
COPY . .

# ספריות מתמשכות (לא חובה, אבל נוח לשימוש עם Volumes)
RUN mkdir -p /app/tokens /app/logs && chown -R node:node /app
USER node

# אם ה-entry שונה, עדכן כאן
CMD ["npm","start"]
