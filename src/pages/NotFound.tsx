import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Home, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mx-auto mb-6 flex items-center justify-center w-20 h-20 bg-destructive/10 rounded-full">
          <Bot className="h-10 w-10 text-destructive" />
        </div>
        
        <h1 className="text-6xl font-bold mb-4 text-foreground">404</h1>
        <h2 className="text-2xl font-semibold mb-4">הדף לא נמצא</h2>
        <p className="text-muted-foreground mb-8">
          מצטערים, הדף שחיפשת לא קיים במערכת. 
          <br />
          ייתכן שהקישור שגוי או שהדף הועבר למיקום אחר.
        </p>
        
        <div className="space-y-3">
          <Button asChild size="lg" className="w-full">
            <a href="/">
              <Home className="ml-2 h-4 w-4" />
              חזור לדף הבית
            </a>
          </Button>
          
          <p className="text-xs text-muted-foreground">
            הדף המבוקש: {location.pathname}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;