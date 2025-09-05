const venom = require('venom-bot');

// Environment variables with fallbacks
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qtibjfewdkgjgmwojlta.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aWJqZmV3ZGtnamdtd29qbHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTMzMzIsImV4cCI6MjA3MjY2OTMzMn0.7B7NwagU8pPs2BF32wAkxK6n92XpJsrR_sOfzzSCpgs';
const BUSINESS_PHONE = process.env.BUSINESS_PHONE || 'YOUR_BUSINESS_PHONE';
const SESSION_NAME = process.env.SESSION_NAME || 'mamaz-ai-bot';
const HEADLESS = process.env.HEADLESS === 'true' || process.env.NODE_ENV === 'production';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required environment variables
if (BUSINESS_PHONE === 'YOUR_BUSINESS_PHONE' || !BUSINESS_PHONE) {
  console.error('❌ BUSINESS_PHONE environment variable must be set!');
  console.error('   Example: BUSINESS_PHONE=972501234567');
  process.exit(1);
}

console.log('🔧 Configuration:');
console.log(`   Environment: ${NODE_ENV}`);
console.log(`   Business Phone: ${BUSINESS_PHONE}`);
console.log(`   Session Name: ${SESSION_NAME}`);
console.log(`   Headless Mode: ${HEADLESS}`);
console.log(`   Supabase URL: ${SUPABASE_URL}`);

// Global bot client reference for health checks
let botClient = null;
let isReady = false;

// Enhanced error handling and retry logic
async function callSupabaseFunction(functionName, data, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error calling ${functionName} (attempt ${attempt}/${retries}):`, error.message);
      if (attempt === retries) {
        throw error;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Function to log incoming messages with enhanced error handling
async function logMessage(userId, text, messageType = 'incoming') {
  try {
    const result = await callSupabaseFunction('bot-message', {
      phone: BUSINESS_PHONE,
      userId: userId,
      text: text,
      messageType: messageType,
      timestamp: new Date().toISOString(),
    });

    if (result) {
      console.log(`✅ Message logged: ${messageType} - ${text.substring(0, 50)}...`);
    }
  } catch (error) {
    console.error(`❌ Failed to log message:`, error.message);
  }
}

// Function to get AI reply with enhanced error handling
async function getAIReply(userId, text) {
  try {
    const result = await callSupabaseFunction('get-reply', {
      phone: BUSINESS_PHONE,
      userId: userId,
      text: text,
    });

    if (result && result.reply) {
      console.log(`🤖 AI Reply: ${result.reply.substring(0, 100)}...`);
      return result.reply;
    } else {
      console.log(`❌ No reply received from AI service`);
      return 'סליחה, יש לי בעיה זמנית. אנא נסה שוב מאוחר יותר.';
    }
  } catch (error) {
    console.error(`❌ Failed to get AI reply:`, error.message);
    return 'סליחה, יש לי בעיה זמנית. אנא נסה שוב מאוחר יותר.';
  }
}

// Enhanced message processing with rate limiting
const messageQueue = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_MESSAGES_PER_USER = 10;

function isRateLimited(userId) {
  const now = Date.now();
  if (!messageQueue.has(userId)) {
    messageQueue.set(userId, []);
  }
  
  const userMessages = messageQueue.get(userId);
  // Clean old messages
  const recentMessages = userMessages.filter(time => now - time < RATE_LIMIT_WINDOW);
  messageQueue.set(userId, recentMessages);
  
  if (recentMessages.length >= MAX_MESSAGES_PER_USER) {
    return true;
  }
  
  recentMessages.push(now);
  return false;
}

// Create Venom bot instance with enhanced configuration
venom
  .create({
    session: SESSION_NAME,
    multidevice: true,
    headless: HEADLESS,
    useChrome: true,
    debug: NODE_ENV === 'development',
    logQR: true,
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  })
  .then((client) => {
    botClient = client;
    console.log('🚀 Venom bot started successfully!');
    
    // Listen for incoming messages
    client.onMessage(async (message) => {
      try {
        // Skip messages from groups or broadcast lists
        if (message.isGroupMsg || message.from === 'status@broadcast') {
          return;
        }

        // Skip messages from yourself
        if (message.fromMe) {
          return;
        }

        // Extract sender ID and message text
        const senderId = message.from;
        const messageText = message.body || '';

        // Skip empty messages
        if (!messageText.trim()) {
          return;
        }

        console.log(`📨 Received message from ${senderId}: ${messageText.substring(0, 100)}...`);

        // Rate limiting
        if (isRateLimited(senderId)) {
          console.log(`⚠️ Rate limited user: ${senderId}`);
          await client.sendText(senderId, 'אנא המתן רגע לפני שליחת הודעה נוספת.');
          return;
        }

        // Log the incoming message
        await logMessage(senderId, messageText, 'incoming');

        // Get AI reply
        const aiReply = await getAIReply(senderId, messageText);

        // Send the AI reply back to the user
        if (aiReply) {
          await client.sendText(senderId, aiReply);
          console.log(`📤 Sent reply to ${senderId}: ${aiReply.substring(0, 100)}...`);
          
          // Log the outgoing message
          await logMessage(senderId, aiReply, 'outgoing');
        }

      } catch (error) {
        console.error('❌ Error processing message:', error);
        
        // Send error message to user
        try {
          await client.sendText(message.from, 'סליחה, יש לי בעיה זמנית. אנא נסה שוב מאוחר יותר.');
        } catch (sendError) {
          console.error('❌ Failed to send error message:', sendError);
        }
      }
    });

    // Mark bot as ready
    isReady = true;
    console.log('✅ Bot is ready to receive messages!');
    console.log(`📱 Business phone configured: ${BUSINESS_PHONE}`);
    console.log(`🔗 Connected to Supabase: ${SUPABASE_URL}`);

  })
  .catch((error) => {
    console.error('❌ Error starting Venom bot:', error);
    process.exit(1);
  });

// Health check function
function healthCheck() {
  return isReady && botClient !== null;
}

// Export health check for external monitoring
global.healthCheck = healthCheck;

// Enhanced process termination handling
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Bot shutting down gracefully...`);
  
  if (botClient) {
    try {
      botClient.close();
      console.log('✅ Bot client closed successfully');
    } catch (error) {
      console.error('❌ Error closing bot client:', error);
    }
  }
  
  setTimeout(() => {
    console.log('🔄 Force exit after timeout');
    process.exit(0);
  }, 10000);
  
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// Unhandled rejection handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});