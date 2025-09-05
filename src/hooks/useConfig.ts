import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ConfigData {
  assistant_name: string;
  description: string;
  tone: string;
  working_hours: string;
  service_type: string;
}

// Mock API functions - replace with real API calls
const fetchConfig = async (phone: string): Promise<ConfigData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock response
  return {
    assistant_name: "עוזר דני - מסעדת הים התיכון",
    description: "מסעדה ים תיכונית משפחתית הממוקמת בלב תל אביב. מתמחים בדגים טריים וממאכלי ים איכותיים.",
    tone: "friendly",
    working_hours: "ראשון-חמישי 11:00-23:00, שישי 11:00-15:00",
    service_type: "restaurant"
  };
};

const saveConfig = async (config: ConfigData): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock save - in reality this would be a POST request
  console.log("Saving config:", config);
};

export function useConfig(phone: string | null) {
  return useQuery({
    queryKey: ["config", phone],
    queryFn: () => fetchConfig(phone!),
    enabled: !!phone,
    retry: false,
  });
}

export function useSaveConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: saveConfig,
    onSuccess: () => {
      toast({
        title: "הגדרות נשמרו בהצלחה",
        description: "השינויים יכנסו לתוקף תוך מספר דקות",
      });
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בשמירת ההגדרות",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
      console.error("Save config error:", error);
    },
  });
}