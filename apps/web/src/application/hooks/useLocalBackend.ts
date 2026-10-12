import { useCallback, useEffect, useRef, useState } from 'react';

export type LocalBackendStatus = 'checking' | 'available' | 'unavailable';

const DEFAULT_API_BASE =
  (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ??
  'http://localhost:3001';

const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 2000;

function apiBaseUrl(): string {
  return DEFAULT_API_BASE.replace(/\/$/, '');
}

export function useLocalBackend() {
  const [status, setStatus] = useState<LocalBackendStatus>('checking');
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const probe = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl()}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok) {
        setStatus('available');
        return true;
      }
    } catch {
      // Sin ruido en consola: el UI muestra el estado.
    }
    return false;
  }, []);

  const retry = useCallback(() => {
    attemptsRef.current = 0;
    setStatus('checking');
    void probe().then((ok) => {
      if (!ok) {
        attemptsRef.current = 1;
        timerRef.current = setTimeout(function schedule() {
          void probe().then((success) => {
            if (success) return;
            attemptsRef.current += 1;
            if (attemptsRef.current >= MAX_ATTEMPTS) {
              setStatus('unavailable');
              return;
            }
            timerRef.current = setTimeout(schedule, BASE_DELAY_MS * attemptsRef.current);
          });
        }, BASE_DELAY_MS);
      }
    });
  }, [probe]);

  useEffect(() => {
    retry();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [retry]);

  return {
    status,
    apiBaseUrl: apiBaseUrl(),
    retry,
  };
}
