# Mamaz AI - Venom Bot Integration

בוט WhatsApp המתחבר ל-WhatsApp Web ומשתמש ב-Supabase Edge Functions עבור בינה מלאכותית.

## הוראות התקנה

### 1. התקנת Node.js
וודא שיש לך Node.js מותקן (גרסה 16 ומעלה):
```bash
node --version
npm --version
```

### 2. התקנת הבוט
```bash
cd venom-bot-example
npm install
```

### 3. הגדרת מספר הטלפון
ערוך את הקובץ `bot.js` ועדכן את המשתנה:
```javascript
const BUSINESS_PHONE = 'YOUR_BUSINESS_PHONE'; // למשל: '972501234567'
```

**חשוב**: המספר חייב להיות זהה למספר שרשום במערכת הניהול של Mamaz AI.

### 4. הרצת הבוט
```bash
npm start
```

או במצב פיתוח:
```bash
npm run dev
```

### 5. סריקת QR Code
- בהרצה הראשונה יופיע QR Code במסוף
- סרוק את הקוד עם WhatsApp Web במכשיר שלך
- לאחר החיבור, הבוט יתחיל לעבוד באופן אוטומטי

## איך זה עובד?

1. **קבלת הודעות**: הבוט מאזין להודעות נכנסות ב-WhatsApp
2. **שליחה לSupabase**: כל הודעה נשלחת לEdge Function `get-reply`
3. **יצירת תשובה**: Supabase משתמש ב-OpenAI ליצירת תשובה מותאמת אישית
4. **החזרת תשובה**: הבוט מקבל את התשובה ושולח אותה ללקוח
5. **לוגים**: כל ההודעות נרשמות באמצעות `bot-message`

## API Endpoints

הבוט משתמש ב-2 Edge Functions:

### GET Reply
```
POST https://qtibjfewdkgjgmwojlta.supabase.co/functions/v1/get-reply
```

Body:
```json
{
  "phone": "972501234567",
  "userId": "972501111111@c.us",
  "text": "הודעת הלקוח"
}
```

Response:
```json
{
  "reply": "תשובת הבינה המלאכותית"
}
```

### Bot Message (Logging)
```
POST https://qtibjfewdkgjgmwojlta.supabase.co/functions/v1/bot-message
```

Body:
```json
{
  "phone": "972501234567",
  "userId": "972501111111@c.us",
  "text": "הודעה",
  "messageType": "incoming",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

## פתרון בעיות

### בעיות חיבור
- וודא שהמספר בקובץ `bot.js` זהה למערכת הניהול
- בדוק שה-QR Code נסרק נכון
- וודא חיבור אינטרנט יציב

### שגיאות API
- בדוק שהעסק קיים במערכת עם המספר הנכון
- וודא שהגדרות ה-AI מוגדרות במערכת הניהול

### הודעות לא מגיעות
- בדוק את הלוגים במסוף
- וודא שהבוט לא חסום על ידי WhatsApp
- נסה לעצור ולהפעיל מחדש את הבוט

## הפעלה בסביבת ייצור

### באמצעות PM2
```bash
npm install -g pm2
pm2 start bot.js --name "mamaz-ai-bot"
pm2 save
pm2 startup
```

### Docker
```bash
# צור Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]

# בנה והרץ
docker build -t mamaz-ai-bot .
docker run -d --name mamaz-ai-bot mamaz-ai-bot
```

## אבטחה

- המערכת משתמשת ב-HTTPS בלבד
- כל ה-API Keys שמורים ב-Supabase Secrets
- הבוט לא שומר מידע רגיש מקומית
- כל השיחות מוצפנות ושמורות ב-Supabase

## תמיכה

לשאלות ותמיכה: support@mamaz-ai.com