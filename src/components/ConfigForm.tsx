import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConfigData {
  assistant_name: string;
  description: string;
  tone: string;
  working_hours: string;
  service_type: string;
}

interface ConfigFormProps {
  config: ConfigData | null;
  loading: boolean;
  phoneNumber: string;
  onSave: (config: ConfigData & { phone_number: string }) => void;
}

const toneOptions = [
  { value: "professional", label: "מקצועי" },
  { value: "friendly", label: "ידידותי" },
  { value: "casual", label: "נוח ונגיש" },
  { value: "formal", label: "רשמי" }
];

const serviceTypeOptions = [
  { value: "restaurant", label: "מסעדה" },
  { value: "retail", label: "קמעונאות" },
  { value: "services", label: "שירותים" },
  { value: "healthcare", label: "בריאות" },
  { value: "beauty", label: "יופי ועיצוב" },
  { value: "other", label: "אחר" }
];

export default function ConfigForm({ config, loading, phoneNumber, onSave }: ConfigFormProps) {
  const [formData, setFormData] = useState<ConfigData>(
    config || {
      assistant_name: "",
      description: "",
      tone: "",
      working_hours: "",
      service_type: ""
    }
  );
  
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.assistant_name.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הזן שם עוזר",
        variant: "destructive"
      });
      return;
    }
    
    onSave({ ...formData, phone_number: phoneNumber });
  };

  const handleInputChange = (field: keyof ConfigData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">טוען הגדרות...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <Bot className="h-5 w-5 text-primary" />
          הגדרות העוזר החכם
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="assistant_name">שם העוזר *</Label>
              <Input
                id="assistant_name"
                value={formData.assistant_name}
                onChange={(e) => handleInputChange("assistant_name", e.target.value)}
                placeholder="לדוגמה: עוזר משה - מסעדת הדגים"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">תיאור העסק</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="תאר את העסק שלך - מה אתה מציע, איפה אתה נמצא, מה מייחד אותך..."
                className="text-right min-h-[100px]"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tone">סגנון דיבור</Label>
                <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סגנון דיבור" />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">סוג העסק</Label>
                <Select value={formData.service_type} onValueChange={(value) => handleInputChange("service_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוג עסק" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="working_hours">שעות פעילות</Label>
              <Input
                id="working_hours"
                value={formData.working_hours}
                onChange={(e) => handleInputChange("working_hours", e.target.value)}
                placeholder="לדוגמה: ראשון-חמישי 9:00-17:00, שישי 9:00-14:00"
                className="text-right"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            <Save className="mr-2 h-4 w-4" />
            שמור הגדרות
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}