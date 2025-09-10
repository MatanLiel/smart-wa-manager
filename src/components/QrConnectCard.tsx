import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

interface BotStatus {
  status: 'disconnected' | 'qr_ready' | 'connecting' | 'connected';
  isReady: boolean;
  hasQR: boolean;
  timestamp: string;
}

interface QrData {
  qr: string;
}

const QrConnectCard = () => {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceReachable, setServiceReachable] = useState<boolean | null>(null);
  const [pollInterval, setPollInterval] = useState(3000);
  const [retryCount, setRetryCount] = useState(0);

  // Get bot URL from environment or use default for Railway
  const BOT_API_URL = import.meta.env.VITE_BOT_API_URL || 'https://your-bot-service.railway.app';

  // Pre-flight health check
  const checkServiceHealth = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${BOT_API_URL}/`, {
        signal: controller.signal,
        method: 'GET'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setServiceReachable(true);
        console.log('✅ Bot service is reachable');
        return true;
      } else {
        setServiceReachable(false);
        console.warn(`⚠️ Bot service responded with ${response.status}`);
        return false;
      }
    } catch (err) {
      setServiceReachable(false);
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.error('❌ Bot service timeout (5s)');
          setError('Timeout - Service took too long to respond');
        } else if (err.message.includes('Failed to fetch')) {
          console.error('❌ Bot service unreachable - Check Railway deployment');
          setError('Service unreachable - Check Railway deployment');
        } else {
          console.error('❌ Bot service error:', err.message);
          setError(`Connection error: ${err.message}`);
        }
      }
      return false;
    }
  };

  const fetchBotStatus = async () => {
    // Only proceed if service health check passed or we're retrying
    if (serviceReachable === false && retryCount === 0) {
      console.log('🔄 Skipping status check - service not reachable');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${BOT_API_URL}/status`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const status: BotStatus = await response.json();
      setBotStatus(status);
      
      // Reset polling interval and retry count on success
      if (retryCount > 0) {
        console.log('✅ Connection restored');
        setRetryCount(0);
        setPollInterval(3000);
      }
      
      // Fetch QR if available
      if (status.hasQR && status.status === 'qr_ready') {
        try {
          const qrResponse = await fetch(`${BOT_API_URL}/qr`);
          if (qrResponse.ok) {
            const qrData: QrData = await qrResponse.json();
            setQrData(qrData.qr);
          }
        } catch (qrError) {
          console.warn('⚠️ Failed to fetch QR code:', qrError);
        }
      } else {
        setQrData(null);
      }
      
      setError(null);
      setServiceReachable(true);
    } catch (err) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      // Exponential backoff: 3s → 6s → 12s → 24s → 30s (capped)
      const newInterval = Math.min(3000 * Math.pow(2, newRetryCount - 1), 30000);
      setPollInterval(newInterval);
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.error(`❌ Bot status timeout (attempt ${newRetryCount})`);
          setError('Status check timeout');
        } else if (err.message.includes('Failed to fetch')) {
          console.error(`❌ Bot status unreachable (attempt ${newRetryCount})`);
          setError('Status service unreachable');
        } else {
          console.error(`❌ Bot status error (attempt ${newRetryCount}):`, err.message);
          setError(`Status error: ${err.message}`);
        }
      }
      
      setBotStatus(null);
      setQrData(null);
      console.log(`🔄 Next retry in ${newInterval/1000}s (attempt ${newRetryCount})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial health check before starting polling
    const initializeService = async () => {
      console.log(`🔍 Checking bot service health: ${BOT_API_URL}`);
      const isHealthy = await checkServiceHealth();
      
      if (isHealthy) {
        // If healthy, fetch status immediately
        await fetchBotStatus();
      } else {
        // If not healthy, still try status (might be /health endpoint missing)
        console.log('⚠️ Health check failed, attempting status anyway...');
        await fetchBotStatus();
      }
    };

    initializeService();
    
    // Set up dynamic polling interval
    const interval = setInterval(() => {
      fetchBotStatus();
    }, pollInterval);
    
    return () => clearInterval(interval);
  }, [BOT_API_URL, pollInterval]); // Re-run when pollInterval changes

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-success text-success-foreground';
      case 'connecting': return 'bg-warning text-warning-foreground';
      case 'qr_ready': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'connecting': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'qr_ready': return <Smartphone className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'מחובר לWhatsApp';
      case 'connecting': return 'מתחבר...';
      case 'qr_ready': return 'סרוק QR בטלפון';
      case 'disconnected': return 'מנותק';
      default: return 'לא ידוע';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          <span>טוען סטטוס הבוט...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            שגיאה בחיבור לבוט
          </CardTitle>
          <CardDescription>
            לא ניתן להתחבר לשרת הבוט: {error}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-mono text-muted-foreground mb-2">
              שרת הבוט: <a href={BOT_API_URL} target="_blank" rel="noopener" className="text-primary hover:underline">{BOT_API_URL}</a>
            </p>
            {serviceReachable === false && (
              <div className="text-sm space-y-2">
                <p className="font-medium text-destructive">מדריך פתרון בעיות:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>בדוק שה-Railway deployment פעיל</li>
                  <li>וודא שהשרות מוגדר עם Public Networking</li>
                  <li>בדוק את הלוגים ב-Railway</li>
                  <li>וודא שכל משתני הסביבה מוגדרים</li>
                </ul>
              </div>
            )}
          </div>
          {retryCount > 0 && (
            <p className="text-sm text-muted-foreground">
              נסיון {retryCount} - ניסיון חוזר בעוד {pollInterval/1000} שניות
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            חיבור WhatsApp
          </span>
          {botStatus && (
            <Badge className={getStatusColor(botStatus.status)}>
              {getStatusIcon(botStatus.status)}
              <span className="mr-1">{getStatusText(botStatus.status)}</span>
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {botStatus?.status === 'connected' 
            ? 'הבוט מחובר ופעיל בWhatsApp' 
            : 'התחבר לWhatsApp כדי להפעיל את הבוט'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {botStatus?.status === 'qr_ready' && qrData && (
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <img 
                src={qrData} 
                alt="WhatsApp QR Code" 
                className="w-48 h-48"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              פתח WhatsApp בטלפון ← תפריט (3 נקודות) ← WhatsApp Web ← סרוק QR
            </p>
          </div>
        )}
        
        {botStatus?.status === 'connected' && (
          <div className="flex flex-col items-center space-y-2">
            <CheckCircle className="h-12 w-12 text-success" />
            <p className="text-center font-medium">הבוט מחובר בהצלחה!</p>
            <p className="text-sm text-muted-foreground text-center">
              עכשיו אפשר לשלוח הודעות לבוט בWhatsApp
            </p>
          </div>
        )}
        
        {botStatus?.status === 'connecting' && (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center">מתחבר לWhatsApp...</p>
          </div>
        )}
        
        {botStatus?.status === 'disconnected' && (
          <div className="flex flex-col items-center space-y-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-center text-muted-foreground">הבוט אינו פעיל כרגע</p>
            <div className="text-xs text-muted-foreground text-center mt-4 space-y-1">
              <p>בדוק שהשרת פועל ב-Railway</p>
              <p>וודא שכל משתני הסביבה מוגדרים</p>
            </div>
          </div>
        )}
        
        {/* Debug info - shown at bottom */}
        <div className="mt-6 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center font-mono">
            שרת: {BOT_API_URL}
          </p>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-1">
              ניסיון {retryCount} • מקושר כל {pollInterval/1000}s
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QrConnectCard;