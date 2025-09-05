import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Search, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhoneInputProps {
  onSubmit: (phone: string) => void;
  loading?: boolean;
}

export default function PhoneInput({ onSubmit, loading }: PhoneInputProps) {
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic phone validation
    const phoneRegex = /^[0-9+\-\s()]{7,}$/;
    if (!phoneRegex.test(phone.trim())) {
      toast({
        title: "מספר טלפון לא תקין",
        description: "אנא הזן מספר טלפון תקין",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(phone.trim());
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full">
          <MessageCircle className="h-8 w-8 text-accent" />
        </div>
        <CardTitle className="text-2xl">Mamaz AI</CardTitle>
        <p className="text-muted-foreground">
          ממשק ניהול עוזר WhatsApp חכם
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-right">מספר טלפון העסק</Label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05X-XXX-XXXX או +972-XX-XXX-XXXX"
                className="pr-10 text-right"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              הזן את מספר הטלפון המשויך לעסק להצגת ההגדרות
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                טוען...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                חפש הגדרות
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}