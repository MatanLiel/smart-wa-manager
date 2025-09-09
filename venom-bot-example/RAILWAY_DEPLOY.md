# Railway Deployment Instructions

## Required Environment Variables

Set these in Railway's Variables tab:

```
BUSINESS_PHONE=+972501234567
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
HEADLESS=true
SESSION_NAME=mamaz-ai-bot
DEBUG=false
```

## Railway Settings

1. **Root Directory**: `venom-bot-example`
2. **Start Command**: `npm start`
3. **Runtime**: Node.js 18+

## Deployment Steps

1. Connect your GitHub repo to Railway
2. Set the Root Directory to `venom-bot-example` 
3. Add all environment variables above
4. Deploy - the Docker build will handle dependencies automatically

## Troubleshooting

- Check Railway logs for specific errors
- Ensure phone number matches WhatsApp Business registration
- Verify Supabase credentials are correct
- Make sure all required environment variables are set
- Build timeouts: Uses optimized Puppeteer base image with pre-installed Chrome for faster builds
- The .dockerignore file reduces build context size for improved performance

The bot uses the pre-installed Chrome from the Puppeteer base image and creates session tokens in `/app/tokens`.