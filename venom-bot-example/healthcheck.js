const { healthCheck } = require('./bot.js');

// Simple health check script
try {
  const health = healthCheck();
  console.log('Health Check:', JSON.stringify(health, null, 2));
  
  if (health.status === 'ready') {
    console.log('✅ Bot is healthy and ready');
    process.exit(0);
  } else {
    console.log('⚠️ Bot is not ready yet');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Health check failed:', error.message);
  process.exit(1);
}