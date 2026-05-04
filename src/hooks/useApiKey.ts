import { useState, useCallback } from 'react';
import { testApiKey } from '../utils/ai';

export function useApiKey() {
  const [apiKey, setApiKey] = useState(() => {
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('album-openai-key') || '';
  });
  const [keyValid, setKeyValid] = useState<boolean | null>(null);

  const saveKey = useCallback((key: string) => {
    if (key.trim()) {
      localStorage.setItem('album-openai-key', key.trim());
    } else {
      localStorage.removeItem('album-openai-key');
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
