import { useState } from "react";
import { Bot, Settings, BarChart3 } from "lucide-react";
import PhoneInput from "@/components/PhoneInput";
import ConfigForm from "@/components/ConfigForm";
import OnboardingSteps from "@/components/OnboardingSteps";
import { useConfig, useSaveConfig } from "@/hooks/useConfig";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const { data: config, isLoading: configLoading, error } = useConfig(phoneNumber);
  const saveConfigMutation = useSaveConfig();

  const handlePhoneSubmit = (phone: string) => {
    setPhoneNumber(phone);
  };

  const handleConfigSave = (configData: any) => {
    saveConfigMutation.mutate(configData);
  };

  const handleReset = () => {
    setPhoneNumber(null);
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Mamaz AI</h1>
                <p className="text-sm text-muted-foreground">ממשק ניהול עוזר WhatsApp</p>
              </div>
            </div>
            
            {phoneNumber && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOnboarding(!showOnboarding)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {showOnboarding ? "הסתר שלבים" : "הצג שלבים"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <Settings className="h-4 w-4 mr-2" />
                  החלף מספר
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!phoneNumber ? (
          /* Phone Input Section */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="mx-auto mb-6 flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-4">
                ברוכים הבאים ל-Mamaz AI
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                הפלטפורמה החכמה לבניית עוזרי WhatsApp לעסקים קטנים
              </p>
            </div>
            
            <PhoneInput onSubmit={handlePhoneSubmit} />
          </div>
        ) : (
          /* Configuration Section */
          <div className="max-w-6xl mx-auto">
            {error ? (
              /* Error State - Only for actual server errors, not 404 */
              <div className="text-center py-12">
                <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full">
                  <Settings className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold mb-2">שגיאה בטעינת ההגדרות</h2>
                <p className="text-muted-foreground mb-6">
                  אירעה שגיאה בטעינת ההגדרות. אנא נסה שוב מאוחר יותר.
                </p>
                <Button onClick={handleReset}>
                  נסה שוב
                </Button>
              </div>
            ) : (
              /* Configuration Content */
              <div className="space-y-8">
                {/* Status Bar */}
                <div className="bg-card rounded-lg p-4 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                      <span className="font-medium">מחובר למספר: {phoneNumber}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      עדכון אחרון: היום 14:30
                    </div>
                  </div>
                </div>

                <div className={`grid gap-8 ${showOnboarding ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
                  {/* Configuration Form */}
                  <ConfigForm
                    config={config || null}
                    loading={configLoading}
                    phoneNumber={phoneNumber}
                    onSave={handleConfigSave}
                  />

                  {/* Onboarding Steps */}
                  {showOnboarding && (
                    <OnboardingSteps phoneNumber={phoneNumber} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              © 2024 Mamaz AI. כל הזכויות שמורות.
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>גרסה 1.0.0</span>
              <span>•</span>
              <span>תמיכה: support@mamaz-ai.com</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;