// Simple health check script for Docker container
// This script checks if the bot is running and responsive

const fs = require('fs');
const path = require('path');

async function checkHealth() {
  try {
    // Check if the main process is still running
    if (typeof global.healthCheck === 'function' && global.healthCheck()) {
      console.log('✅ Health check passed');
      process.exit(0);
    }
    
    // Alternative check: Look for recent log activity or session files
    const sessionPath = path.join(__dirname, 'tokens');
    if (fs.existsSync(sessionPath)) {
      const stats = fs.statSync(sessionPath);
      const lastModified = stats.mtime;
      const now = new Date();
      const diffMinutes = (now - lastModified) / (1000 * 60);
      
      // If session was modified in the last 5 minutes, consider it healthy
      if (diffMinutes < 5) {
        console.log('✅ Health check passed (session active)');
        process.exit(0);
      }
    }
    
    console.log('❌ Health check failed');
    process.exit(1);
    
  } catch (error) {
    console.error('❌ Health check error:', error);
    process.exit(1);
  }
}

checkHealth();