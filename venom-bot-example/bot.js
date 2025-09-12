// --- Polyfill fix for Node.js fetch ---
if (typeof File === 'undefined') {
  global.File = class File {};
}

// Dependencies
const venom = require('venom-bot');
const express = require('express');
const cors = require('cors');

// Configuration with validation
const BUSINESS_PHONE = process.env.BUSINESS_PHONE;
const SESSION_NAME = process.env.SESSION_NAME || 'mamaz-ai-bot';
const HEADLESS = process.env.HEADLESS !== 'false';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const PORT = process.env.PORT || 3000;

// Environment validation with detailed error messages
const requiredVars = {
  BUSINESS_PHONE: BUSINESS_PHONE,
  SUPABASE_URL: SUPABASE_URL,
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY
};

const missingVars = Object.entries(requiredVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📋 Required format:');
  console.error('   BUSINESS_PHONE=+972525587933');
  console.error('   SUPABASE_URL=https://your-project.supabase.co');
  console.error('   SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

// Add startup logging for Railway debugging
console.log(`🚀 Starting Mamaz AI WhatsApp Bot`);
console.log(`📱 Business Phone: ${BUSINESS_PHONE}`);
console.log(`🌐 Port: ${PORT}`);
console.log(`🤖 Headless: ${HEADLESS}`);
console.log(`📊 Supabase URL: ${SUPABASE_URL}`);

// Global variables
let botClient = null;
let isReady = false;
let qrCodeData = null;
let connectionStatus = 'disconnected';

// Initialize Express server
const app = express();
app.use(cors());
app.use(express.json());

// Railway-compatible root health endpoint
app.get('/', (req, res) => {
  res.json({ ok: true, message: "Bot is alive" });
});

// API endpoints for status checking
app.get('/status', (req, res) => {
  res.json({
    status: connectionStatus,
    isReady: isReady,
    businessPhone: BUSINESS_PHONE,
    hasQR: !!qrCodeData,
    timestamp: new Date().toISOString()
  });
});

app.get('/qr', (req, res) => {
  if (qrCodeData) {
    res.json({ qr: qrCodeData });
  } else {
    res.status(404).json({ error: 'No QR code available' });
  }
});

app.get('/health', (req, res) => {
  const health = healthCheck();
  res.json({ ok: health.status === 'ready', ...health });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Express server running on port ${PORT}`);
  console.log(`✅ Health check available at http://localhost:${PORT}/health`);
});

// Supabase function caller with retry logic
async function callSupabaseFunction(functionName, data, retries = 3) {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${retries} failed for ${functionName}:`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Message logging
async function logMessage(userId, text, messageType) {
  try {
    await callSupabaseFunction('bot-message', {
      user_id: userId,
      message: text,
      message_type: messageType,
      business_phone: BUSINESS_PHONE
    });
  } catch (error) {
    console.error('❌ Failed to log message:', error.message);
  }
}

// Get AI reply
async function getAIReply(userId, text) {
  try {
    const response = await callSupabaseFunction('get-reply', {
      user_id: userId,
      message: text,
      business_phone: BUSINESS_PHONE
    });
    return response.reply || 'מצטער, אני לא יכול לענות כרגע. נסה שוב מאוחר יותר.';
  } catch (error) {
    console.error('❌ Failed to get AI reply:', error.message);
    return 'מצטער, יש בעיה טכנית. נסה שוב מאוחר יותר.';
  }
}

// Rate limiting
const messageQueue = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;

function isRateLimited(userId) {
  const now = Date.now();
  if (!messageQueue.has(userId)) {
    messageQueue.set(userId, []);
  }
  const userMessages = messageQueue.get(userId);
  const validMessages = userMessages.filter(time => now - time < RATE_WINDOW);
  messageQueue.set(userId, validMessages);
  if (validMessages.length >= RATE_LIMIT) {
    return true;
  }
  validMessages.push(now);
  return false;
}

// Create Venom Bot
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
      '--disable-gpu'
    ],
    puppeteerOptions: {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    },
    qrCallback: (base64Qr, asciiQR, attempts, urlCode) => {
      console.log('📱 QR Code generated, attempt:', attempts);
      qrCodeData = base64Qr;
      connectionStatus = 'qr_ready';
    },
    statusCallback: (statusSession, session) => {
      console.log('📱 Status:', statusSession);
      if (statusSession === 'isLogged') {
        connectionStatus = 'connected';
        qrCodeData = null;
      } else if (statusSession === 'notLogged') {
        connectionStatus = 'disconnected';
      } else if (statusSession === 'browserClose') {
        connectionStatus = 'disconnected';
        isReady = false;
      } else if (statusSession === 'qrReadSuccess') {
        connectionStatus = 'connecting';
      }
    }
  })
  .then((client) => {
    botClient = client;
    isReady = true;
    console.log('✅ Mamaz AI Bot is ready and connected to WhatsApp!');
    console.log(`📱 Business Phone: ${BUSINESS_PHONE}`);

    client.onMessage(async (message) => {
      try {
        console.log('📨 Received message:', {
          from: message.from,
          body: message.body,
          isGroup: message.isGroupMsg
        });

        if (message.isGroupMsg || message.from === 'status@broadcast') return;
        if (message.fromMe) return;

        const userId = message.from;
        const messageText = message.body;

        if (isRateLimited(userId)) {
          console.log(`⚠️ Rate limit exceeded for user: ${userId}`);
          await client.sendText(userId, 'אנא המתן רגע לפני שליחת הודעה נוספת.');
          return;
        }

        await logMessage(userId, messageText, 'incoming');
        const aiReply = await getAIReply(userId, messageText);
        await client.sendText(userId, aiReply);
        console.log('✅ Reply sent successfully');
        await logMessage(userId, aiReply, 'outgoing');

      } catch (error) {
        console.error('❌ Error processing message:', error);
        try {
          await client.sendText(message.from, 'מצטער, יש בעיה טכנית. נסה שוב מאוחר יותר.');
        } catch (sendError) {
          console.error('❌ Failed to send error message:', sendError);
        }
      }
    });

  })
  .catch((error) => {
    console.error('❌ Error creating Venom Bot:', error);
    process.exit(1);
  });

// Health check function
function healthCheck() {
  return {
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    business_phone: BUSINESS_PHONE
  };
}

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\n🔄 Received ${signal}. Gracefully shutting down...`);
  if (botClient) {
    botClient.close()
      .then(() => {
        console.log('✅ Bot client closed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error closing bot client:', error);
        process.exit(1);
      });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

module.exports = { healthCheck };
