const venom = require('venom-bot');

// Supabase configuration
const SUPABASE_URL = 'https://qtibjfewdkgjgmwojlta.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aWJqZmV3ZGtnamdtd29qbHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTMzMzIsImV4cCI6MjA3MjY2OTMzMn0.7B7NwagU8pPs2BF32wAkxK6n92XpJsrR_sOfzzSCpgs';

// Your business phone number (the number this bot is running on)
const BUSINESS_PHONE = 'YOUR_BUSINESS_PHONE'; // e.g., '972501234567'

// Function to call Supabase Edge Functions
async function callSupabaseFunction(functionName, data) {
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
    console.error(`Error calling ${functionName}:`, error);
    return null;
  }
}

// Function to log incoming messages
async function logMessage(userId, text, messageType = 'incoming') {
  const result = await callSupabaseFunction('bot-message', {
    phone: BUSINESS_PHONE,
    userId: userId,
    text: text,
    messageType: messageType,
    timestamp: new Date().toISOString(),
  });

  if (result) {
    console.log(`✅ Message logged:`, result);
  } else {
    console.log(`❌ Failed to log message`);
  }
}

// Function to get AI reply
async function getAIReply(userId, text) {
  const result = await callSupabaseFunction('get-reply', {
    phone: BUSINESS_PHONE,
    userId: userId,
    text: text,
  });

  if (result && result.reply) {
    console.log(`🤖 AI Reply: ${result.reply}`);
    return result.reply;
  } else {
    console.log(`❌ Failed to get AI reply:`, result);
    return 'סליחה, יש לי בעיה זמנית. אנא נסה שוב מאוחר יותר.';
  }
}

// Create Venom bot instance
venom
  .create({
    session: 'mamaz-ai-bot',
    multidevice: true, // Enable multi-device support
    headless: true, // Set to false if you want to see the browser
  })
  .then((client) => {
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
        const messageText = message.body;

        console.log(`📨 Received message from ${senderId}: ${messageText}`);

        // Log the incoming message
        await logMessage(senderId, messageText, 'incoming');

        // Get AI reply
        const aiReply = await getAIReply(senderId, messageText);

        // Send the AI reply back to the user
        if (aiReply) {
          await client.sendText(senderId, aiReply);
          console.log(`📤 Sent reply to ${senderId}: ${aiReply}`);
          
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

    // Log when the bot is ready
    console.log('✅ Bot is ready to receive messages!');
    console.log(`📱 Business phone configured: ${BUSINESS_PHONE}`);
    console.log(`🔗 Connected to Supabase: ${SUPABASE_URL}`);

  })
  .catch((error) => {
    console.error('❌ Error starting Venom bot:', error);
  });

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Bot shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Bot shutting down...');
  process.exit(0);
});