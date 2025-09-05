import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ConfigData {
  assistant_name: string;
  description: string;
  tone: string;
  working_hours: string;
  service_type: string;
}

// Real API functions
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const fetchConfig = async (phone: string): Promise<ConfigData> => {
  const response = await fetch(`${API_BASE_URL}/config/${encodeURIComponent(phone)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

const saveConfig = async (config: ConfigData): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save config: ${response.status} ${response.statusText}`);
  }
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