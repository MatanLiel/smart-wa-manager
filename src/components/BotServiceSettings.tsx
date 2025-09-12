import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useBotApiUrl } from "@/hooks/useBotApiUrl";

export default function BotServiceSettings() {
  const { url, setUrl, reset, defaultUrl } = useBotApiUrl();
  const [value, setValue] = useState(url);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | { ok: boolean; status?: number; error?: string }>(null);
  const { toast } = useToast();

  const handleSave = () => {
    setUrl(value.trim());
    toast({ title: "הגדרה נשמרה", description: "כתובת שרת הבוט עודכנה" });
  };

  const handleReset = () => {
    reset();
    setValue(defaultUrl);
    toast({ title: "אופסנו לברירת מחדל", description: "חזרנו לכתובת המקורית" });
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const base = value.trim().replace(/\/$/, "");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`${base}/status`, { signal: controller.signal });
      clearTimeout(timeoutId);
      setTestResult({ ok: res.ok, status: res.status });
      if (res.ok) {
        toast({ title: "החיבור הצליח", description: `HTTP ${res.status}` });
      } else {
        toast({ title: "החיבור נכשל", description: `HTTP ${res.status}`, variant: "destructive" });
      }
    } catch (e: any) {
      setTestResult({ ok: false, error: e?.message || "Failed to fetch" });
      toast({ title: "שגיאת חיבור", description: e?.message || "Failed to fetch", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          הגדרות שרת הבוט
        </CardTitle>
        <CardDescription>עדכן ובדוק את כתובת ה-API של הבוט (Railway)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bot_api_url">Bot API URL</Label>
          <Input
            id="bot_api_url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://your-bot-service.railway.app"
            className="text-left"
          />
          <p className="text-xs text-muted-foreground">נוכחי: {url}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={testConnection} disabled={testing} variant="outline">
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            בדיקת חיבור
          </Button>
          <Button type="button" onClick={handleSave}>שמור</Button>
          <Button type="button" onClick={handleReset} variant="ghost">איפוס לברירת מחדל</Button>
        </div>

        {testResult && (
          <div className="text-sm">
            {testResult.ok ? (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="h-4 w-4" />
                <span>החיבור הצליח {testResult.status ? `(HTTP ${testResult.status})` : ""}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                <span>החיבור נכשל: {testResult.error || `HTTP ${testResult.status}`}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
