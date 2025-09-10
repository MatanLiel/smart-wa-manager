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

  // Get bot URL from environment or use default for Railway
  const BOT_API_URL = import.meta.env.VITE_BOT_API_URL || 'https://your-bot-service.railway.app';

  const fetchBotStatus = async () => {
    try {
      const response = await fetch(`${BOT_API_URL}/status`);
      if (!response.ok) throw new Error('Failed to fetch bot status');
      
      const status: BotStatus = await response.json();
      setBotStatus(status);
      
      // Fetch QR if available
      if (status.hasQR && status.status === 'qr_ready') {
        try {
          const qrResponse = await fetch(`${BOT_API_URL}/qr`);
          if (qrResponse.ok) {
            const qrData: QrData = await qrResponse.json();
            setQrData(qrData.qr);
          }
        } catch (qrError) {
          console.warn('Failed to fetch QR code:', qrError);
        }
      } else {
        setQrData(null);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setBotStatus(null);
      setQrData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
    
    // Poll every 3 seconds
    const interval = setInterval(fetchBotStatus, 3000);
    
    return () => clearInterval(interval);
  }, [BOT_API_URL]);

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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QrConnectCard;