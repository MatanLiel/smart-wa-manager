import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bot_api_url";

export function useBotApiUrl() {
  const defaultUrl = useMemo(() => {
    const envUrl = (import.meta as any)?.env?.VITE_BOT_API_URL as string | undefined;
    return envUrl || "https://your-bot-service.railway.app";
  }, []);

  const [url, setUrlState] = useState<string>(defaultUrl);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUrlState(saved);
    } catch (_) {}
  }, []);

  const setUrl = (next: string) => {
    setUrlState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  };

  const reset = () => {
    setUrl(defaultUrl);
  };

  return { url, setUrl, reset, defaultUrl } as const;
}
