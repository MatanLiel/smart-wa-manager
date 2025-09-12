// --- Polyfills (keep server alive on Node 18/20) ---
(() => {
  try {
    const u = require('undici');
    globalThis.fetch ??= u.fetch;
    globalThis.Headers ??= u.Headers;
    globalThis.Request ??= u.Request;
    globalThis.Response ??= u.Response;
    globalThis.FormData ??= u.FormData;
    globalThis.File ??= u.File || class {};
    globalThis.Blob ??= u.Blob;
  } catch (_) {
    // Fallback to node-fetch if undici isn't available
    if (typeof fetch === 'undefined') {
      globalThis.fetch = (...args) =>
        import('node-fetch').then(m => m.default(...args));
    }
    if (typeof File === 'undefined') globalThis.File = class {};
  }
})();

// Deps
const express = require('express');
const cors = require('cors');
const venom = require('venom-bot');

// Config
const PORT = process.env.PORT || 3000;
const BUSINESS_PHONE = process.env.BUSINESS_PHONE || '';
const SESSION_NAME = process.env.SESSION_NAME || 'mamaz-ai-bot';
const HEADLESS = process.env.HEADLESS !== 'false';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const DISABLE_VENOM = process.env.DISABLE_VENOM === 'true';

// State
let botClient = null;
let isReady = false;
let qrCodeData = null;
let connectionStatus = 'disconnected';

// App
const app = express();
app.use(cors());
app.use(express.json());

// Health endpoints (always respond to avoid 502)
app.get('/', (_req, res) => res.json({ ok: true, message: 'Bot is alive' }));
app.get('/health', (_req, res) =>
  res.json({ ok: true, status: isReady ? 'ready' : 'not_ready', ts: new Date().toISOString() })
);
app.get('/status', (_req, res) =>
  res.json({
    status: connectionStatus,
    isReady,
    businessPhone: BUSINESS_PHONE || null,
    hasQR: !!qrCodeData,
    timestamp: new Date().toISOString(),
  })
);
app.get('/qr', (_req, res) => {
  if (qrCodeData) return res.json({ qr: qrCodeData });
  res.status(404).json({ error: 'No QR code available' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Express server running on port ${PORT}`);
});

// Log env warnings but DO NOT exit (keep HTTP alive)
const missing = [];
if (!BUSINESS_PHONE) missing.push('BUSINESS_PHONE');
if (!SUPABASE_URL) missing.push('SUPABASE_URL');
if (!SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
if (missing.length) console.warn('⚠️ Missing ENV:', missing.join(', '));

// Supabase helper (skips when ENV missing)
async function callSupabaseFunction(functionName, data, retries = 3) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return { ok: false, skipped: true };
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const rsp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify(data),
      });
      if (!rsp.ok) throw new Error(`HTTP ${rsp.status}: ${rsp.statusText}`);
      return await rsp.json();
    } catch (err) {
      console.error(`❌ Supabase ${functionName} attempt ${attempt}/${retries}:`, err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 2 ** attempt * 1000));
    }
  }
}

// Rate limit
const RATE_LIMIT = 10; // per minute
const RATE_WINDOW = 60 * 1000;
const messageQueue = new Map();
function isRateLimited(userId) {
  const now = Date.now();
  const arr = (messageQueue.get(userId) || []).filter(t => now - t < RATE_WINDOW);
  if (arr.length >= RATE_LIMIT) return true;
  arr.push(now);
  messageQueue.set(userId, arr);
  return false;
}

// Start Venom (non-blocking)
if (DISABLE_VENOM) {
  console.log('🟡 Venom disabled (DISABLE_VENOM=true). HTTP is up.');
} else {
  setImmediate(() => {
    venom
      .create({
        session: SESSION_NAME,
        headless: HEADLESS,
        useChrome: false,
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
        puppeteerOptions: {
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        },
        qrCallback: (base64Qr, _asciiQR, attempts) => {
          console.log('📱 QR generated, attempt:', attempts);
          qrCodeData = base64Qr;
          connectionStatus = 'qr_ready';
        },
        // venom v5 uses `statusFind` hook
        statusFind: (statusSession /*, session */) => {
          console.log('📱 Status:', statusSession);
          if (statusSession === 'isLogged') {
            connectionStatus = 'connected';
            qrCodeData = null;
            isReady = true;
          } else if (statusSession === 'qrReadSuccess') {
            connectionStatus = 'connecting';
          } else {
            connectionStatus = 'disconnected';
            isReady = false;
          }
        },
      })
      .then(client => {
        botClient = client;
        console.log('✅ Venom client created');

        client.onMessage(async message => {
          try {
            if (message.isGroupMsg || message.from === 'status@broadcast' || message.fromMe) return;

            const userId = message.from;
            const text = message.body || '';

            if (isRateLimited(userId)) {
              await client.sendText(userId, 'אנא המתן רגע לפני שליחת הודעה נוספת.');
              return;
            }

            // Log incoming
            try {
              await callSupabaseFunction('bot-message', {
                user_id: userId,
                message: text,
                message_type: 'incoming',
                business_phone: BUSINESS_PHONE || null,
              });
            } catch (e) {
              console.warn('⚠️ log incoming skipped/failed:', e.message);
            }

            // AI reply (falls back if no Supabase)
            let reply = 'מצטער, אני לא יכול לענות כרגע. נסה שוב מאוחר יותר.';
            try {
              const rsp = await callSupabaseFunction('get-reply', {
                user_id: userId,
                message: text,
                business_phone: BUSINESS_PHONE || null,
              });
              if (rsp && rsp.reply) reply = rsp.reply;
            } catch (e) {
              console.warn('⚠️ get-reply failed:', e.message);
            }

            await client.sendText(userId, reply);

            // Log outgoing
            try {
              await callSupabaseFunction('bot-message', {
                user_id: userId,
                message: reply,
                message_type: 'outgoing',
                business_phone: BUSINESS_PHONE || null,
              });
            } catch (e) {
              console.warn('⚠️ log outgoing skipped/failed:', e.message);
            }
          } catch (err) {
            console.error('❌ onMessage error:', err);
            try {
              await botClient.sendText(message.from, 'מצטער, יש בעיה טכנית. נסה שוב מאוחר יותר.');
            } catch (_) {}
          }
        });
      })
      .catch(err => {
        console.error('❌ Error creating Venom Bot:', err);
        connectionStatus = 'error';
        // keep HTTP alive
      });
  });
}

// Graceful shutdown
function graceful(signal) {
  console.log(`🔻 ${signal} received`);
  if (botClient) {
    botClient
      .close()
      .then(() => process.exit(0))
      .catch(() => process.exit(0));
  } else {
    process.exit(0);
  }
}
process.on('SIGINT', () => graceful('SIGINT'));
process.on('SIGTERM', () => graceful('SIGTERM'));
process.on('SIGUSR2', () => graceful('SIGUSR2')); // pm2 reload

// Export (optional)
module.exports = {};
