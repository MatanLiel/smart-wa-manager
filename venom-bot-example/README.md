# Mamaz AI - Venom Bot Integration (Production Ready)

בוט WhatsApp המתחבר ל-WhatsApp Web ומשתמש ב-Supabase Edge Functions עבור בינה מלאכותית.

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
# 1. Clone and setup
git clone <your-repo>
cd venom-bot-example

# 2. Configure environment
cp .env.example .env
# Edit .env with your BUSINESS_PHONE

# 3. Run with Docker
npm run docker:prod
```

### Option 2: Local Development
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your BUSINESS_PHONE

# 3. Run in development mode
npm run dev
```

## 📋 Prerequisites

### Local Development
- Node.js 16+ and npm 8+
- WhatsApp account with the registered business number

### Production Deployment
- Docker and Docker Compose, OR
- Cloud platform account (Railway, Render, DigitalOcean)
- The WhatsApp business number registered in Mamaz AI system

## ⚙️ Configuration

### Required Environment Variables
```bash
# Your business phone (MUST match Mamaz AI registration)
BUSINESS_PHONE=972501234567  # Example format
```

### Optional Environment Variables
```bash
SESSION_NAME=mamaz-ai-bot     # Bot session name
HEADLESS=true                 # Run without browser UI
NODE_ENV=production          # Environment mode
```

See `.env.example` for complete configuration options.

## 🔧 Development Commands

```bash
npm run dev              # Development with nodemon
npm run start            # Production start
npm run health           # Health check
npm run logs:clear       # Clear log files
npm run tokens:clear     # Clear session tokens
```

## 🐳 Docker Commands

```bash
npm run docker:dev       # Development environment
npm run docker:prod      # Production environment
npm run docker:stop      # Stop containers
```

## 📊 PM2 Commands (Production)

```bash
npm run pm2:start        # Start with PM2
npm run pm2:stop         # Stop PM2 process
npm run pm2:restart      # Restart PM2 process
npm run pm2:logs         # View logs
npm run pm2:monit        # Monitor processes
```

## ☁️ Cloud Deployment

### Railway
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway new
railway link
railway up

# 3. Set environment variables in Railway dashboard
BUSINESS_PHONE=972501234567
NODE_ENV=production
HEADLESS=true
```

### Render
1. Connect your GitHub repository
2. Create new Web Service
3. Set build command: `npm install`
4. Set start command: `npm run prod`
5. Add environment variables:
   - `BUSINESS_PHONE=972501234567`
   - `NODE_ENV=production`
   - `HEADLESS=true`

### DigitalOcean App Platform
1. Create new app from GitHub
2. Configure build settings:
   - Build command: `npm install`
   - Run command: `npm run prod`
3. Add environment variables in dashboard

### Heroku
```bash
# 1. Install Heroku CLI and login
heroku login

# 2. Create app
heroku create mamaz-ai-bot

# 3. Set environment variables
heroku config:set BUSINESS_PHONE=972501234567
heroku config:set NODE_ENV=production
heroku config:set HEADLESS=true

# 4. Deploy
git push heroku main
```

## 🔧 VPS/Server Deployment

### With Docker
```bash
# 1. Install Docker on your server
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. Clone repository
git clone <your-repo>
cd venom-bot-example

# 3. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 4. Run production
docker-compose --profile prod up -d

# 5. Monitor logs
docker-compose logs -f mamaz-ai-bot
```

### With PM2
```bash
# 1. Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# 2. Setup application
git clone <your-repo>
cd venom-bot-example
npm install

# 3. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 4. Start with PM2
npm run pm2:start

# 5. Setup auto-restart on boot
pm2 startup
pm2 save
```

## 🔍 Monitoring and Logs

### Docker Logs
```bash
docker-compose logs -f mamaz-ai-bot
```

### PM2 Monitoring
```bash
pm2 logs mamaz-ai-bot
pm2 monit
```

### Health Check
The bot includes built-in health checks:
- HTTP endpoint (if enabled)
- Session file monitoring
- Process status validation

## 🛠️ Troubleshooting

### Common Issues

**QR Code doesn't appear:**
- Set `HEADLESS=false` in development
- Check Docker logs for errors
- Ensure ports are not blocked

**Bot doesn't respond:**
- Verify `BUSINESS_PHONE` matches Mamaz AI registration
- Check Supabase Edge Functions logs
- Verify WhatsApp session is active

**Memory issues:**
- Bot restarts automatically at 1GB memory usage
- Daily restart configured at 3 AM
- Use `docker stats` to monitor resource usage

**Authentication problems:**
- Clear session: `npm run tokens:clear`
- Restart and scan QR code again
- Check if WhatsApp Web is logged out on other devices

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development HEADLESS=false npm run dev
```

## 🔒 Security Features

- Non-root user in Docker container
- Rate limiting (10 messages per minute per user)
- Input validation and sanitization
- Automatic session management
- Error handling and graceful shutdown
- Health monitoring

## 📈 Production Features

### Reliability
- Automatic restart on crashes
- Health checks with Docker
- PM2 process management
- Graceful shutdown handling
- Session persistence

### Performance
- Rate limiting
- Memory management
- Efficient message queuing
- Resource monitoring
- Log rotation

### Monitoring
- Structured logging
- Health check endpoints
- Process monitoring
- Error tracking
- Performance metrics

## 🚨 Important Notes

1. **Phone Number**: Must exactly match the number registered in Mamaz AI system
2. **Session Persistence**: Session tokens are saved to prevent re-authentication
3. **Memory Management**: Bot automatically restarts at 1GB memory usage
4. **Rate Limiting**: 10 messages per minute per user to prevent spam
5. **Auto Recovery**: Built-in error handling and retry mechanisms

## 📞 Support

For technical support: support@mamaz-ai.com

## 🔗 Useful Links

- [Venom Bot Documentation](https://github.com/orkestral/venom)
- [Supabase Documentation](https://supabase.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

## 📜 License

MIT License - see LICENSE file for details.