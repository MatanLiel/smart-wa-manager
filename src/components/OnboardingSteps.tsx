import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "error";
  order: number;
}

interface OnboardingStepsProps {
  phoneNumber?: string;
}

export default function OnboardingSteps({ phoneNumber }: OnboardingStepsProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (phoneNumber) {
      fetchOnboardingSteps();
    }
  }, [phoneNumber]);

  const fetchOnboardingSteps = async () => {
    setLoading(true);
    try {
      // This would be a real API call
      // const response = await fetch('/api/onboarding');
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockSteps: OnboardingStep[] = [
        {
          id: "1",
          title: "הגדרת הפרופיל הבסיסי",
          description: "הזנת שם העסק ותיאור בסיסי",
          status: "completed",
          order: 1
        },
        {
          id: "2", 
          title: "הגדרת טון ודיבור",
          description: "בחירת סגנון התקשורת של העוזר",
          status: "completed",
          order: 2
        },
        {
          id: "3",
          title: "הגדרת שעות פעילות",
          description: "קביעת זמני מענה אוטומטי",
          status: "in_progress",
          order: 3
        },
        {
          id: "4",
          title: "חיבור לWhatsApp Business",
          description: "קישור חשבון WhatsApp Business",
          status: "pending",
          order: 4
        },
        {
          id: "5",
          title: "בדיקת המערכת",
          description: "וידוא שהעוזר עובד כראוי",
          status: "pending",
          order: 5
        }
      ];
      
      setSteps(mockSteps);
    } catch (error) {
      console.error("Failed to fetch onboarding steps:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (status: OnboardingStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-warning" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: OnboardingStep["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-success text-success-foreground">הושלם</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">בתהליך</Badge>;
      case "error":
        return <Badge variant="destructive">שגיאה</Badge>;
      default:
        return <Badge variant="outline">ממתין</Badge>;
    }
  };

  if (!phoneNumber) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">שלבי ההגדרה הראשונית</CardTitle>
        <p className="text-muted-foreground text-right">
          מעקב אחר התקדמות הגדרת העוזר החכם
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <span className="mr-3">טוען שלבים...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {steps
              .sort((a, b) => a.order - b.order)
              .map((step) => (
                <div
                  key={step.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-between mb-2">
                      <div>{getStatusBadge(step.status)}</div>
                      <h4 className="font-medium">{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}