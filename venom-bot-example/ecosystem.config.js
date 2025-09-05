// PM2 ecosystem configuration for production deployment

module.exports = {
  apps: [{
    name: 'mamaz-ai-bot',
    script: 'bot.js',
    instances: 1, // Venom-bot doesn't support clustering
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      HEADLESS: 'false'
    },
    env_production: {
      NODE_ENV: 'production',
      HEADLESS: 'true'
    },
    // Log configuration
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Restart configuration
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Advanced PM2 features
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Monitoring
    pmx: true,
    
    // Process management
    exec_mode: 'fork', // Use fork mode for single instance
    
    // Advanced options
    node_args: '--max-old-space-size=512',
    
    // Environment-specific settings
    merge_logs: true,
    
    // Cron restart (restart daily at 3 AM to clear memory)
    cron_restart: '0 3 * * *',
    
    // Auto restart if app crashes
    ignore_watch: [
      'node_modules',
      'logs',
      'tokens',
      '.git'
    ]
  }],

  deploy: {
    production: {
      user: 'node',
      host: 'YOUR_SERVER_IP',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/mamaz-ai-bot.git',
      path: '/var/www/mamaz-ai-bot',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};