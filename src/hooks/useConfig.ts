import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ConfigData {
  assistant_name: string;
  description: string;
  tone: string;
  working_hours: string;
  service_type: string;
}

import { supabase } from "@/integrations/supabase/client";

const fetchConfig = async (phone: string): Promise<ConfigData | null> => {
  // Use a direct GET request for fetching config by phone
  const response = await fetch(`https://qtibjfewdkgjgmwojlta.supabase.co/functions/v1/config/${encodeURIComponent(phone)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (response.status === 404) {
    return null; // No config found yet, return null instead of error
  }
  
  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

const saveConfig = async (config: ConfigData & { phone_number: string }): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('config', {
    body: config,
  });
  
  if (error) {
    throw new Error(`Failed to save config: ${error.message}`);
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