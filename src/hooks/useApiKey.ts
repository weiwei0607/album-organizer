import { useState, useCallback } from 'react';
import { testApiKey } from '../utils/ai';

export function useApiKey() {
  const [apiKey, setApiKey] = useState(() => {
    // Migrate from old key name if needed
    const legacy = localStorage.getItem('album-openai-key');
    if (legacy) {
      localStorage.setItem('album-gemini-key', legacy);
      localStorage.removeItem('album-openai-key');
    }
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('album-gemini-key') || '';
  });
  const [keyValid, setKeyValid] = useState<boolean | null>(null);

  const saveKey = useCallback((key: string) => {
    if (key.trim()) {
      localStorage.setItem('album-gemini-key', key.trim());
    } else {
      localStorage.removeItem('album-gemini-key');
    }
    setApiKey(key.trim());
  }, []);

  const validateKey = useCallback(async (key: string) => {
    const valid = await testApiKey(key);
    setKeyValid(valid);
    return valid;
  }, []);

  return { apiKey, keyValid, saveKey, validateKey };
}
