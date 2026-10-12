import { useState, useEffect, useRef, useCallback } from 'react';

export interface TokenTelemetryStreamPacket {
  eventId: string;
  timestamp: string;
  sessionId: string;
  model: {
    name: string;
    contextWindowLimit?: number;
  };
  tokens: {
    prompt: number;
    output: number;
    cached: number;
    thinking: number;
    totalAccumulated: number;
  };
  gauge?: {
    fillPercentage: number;
    severity: 'safe' | 'warning' | 'critical';
    liquidColorHex: string;
  };
  rateLimits?: {
    tpmRemaining: number;
    tpmLimit: number;
    rpmRemaining: number;
    rpmLimit: number;
    resetInSeconds: number;
  };
  financial?: {
    costUSD: number;
    savingsUSD: number;
  };
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

const MAX_WS_ATTEMPTS = 5;
const WS_BASE_DELAY_MS = 2500;

export function useTokenStream(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [packet, setPacket] = useState<TokenTelemetryStreamPacket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wsGivingUp, setWsGivingUp] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);
  const warnedRef = useRef(false);

  const cleanupSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || wsGivingUp) return;

    cleanupSocket();

    try {
      const wsUrl =
        (import.meta as ImportMeta & { env?: { VITE_WS_URL?: string } }).env?.VITE_WS_URL ??
        'ws://localhost:3001/ws';
      setStatus('connecting');
      setError(null);

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        attemptsRef.current = 0;
        setStatus('connected');
        setError(null);

        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const start = performance.now();
            ws.send(JSON.stringify({ type: 'ping' }));
            (ws as WebSocket & { _pingStart?: number })._pingStart = start;
          }
        }, 8000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          if (message.type === 'telemetry_packet' && message.data) {
            setPacket(message.data as TokenTelemetryStreamPacket);
          } else if (message.type === 'pong') {
            const start = (ws as WebSocket & { _pingStart?: number })._pingStart;
            if (start) {
              setLatencyMs(Math.round(performance.now() - start));
            }
          }
        } catch {
          // Ignorar mensajes no JSON
        }
      };

      ws.onerror = () => {
        if (!warnedRef.current) {
          warnedRef.current = true;
        }
        setError('WebSocket local no disponible');
      };

      ws.onclose = () => {
        setStatus('disconnected');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        if (!enabled) return;

        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_WS_ATTEMPTS) {
          setWsGivingUp(true);
          return;
        }

        const delay = WS_BASE_DELAY_MS * attemptsRef.current;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (err: unknown) {
      setStatus('disconnected');
      setError(err instanceof Error ? err.message : 'Fallo de conexión');
    }
  }, [cleanupSocket, enabled, wsGivingUp]);

  useEffect(() => {
    if (!enabled) {
      cleanupSocket();
      setStatus('idle');
      setWsGivingUp(false);
      attemptsRef.current = 0;
      warnedRef.current = false;
      return;
    }

    setWsGivingUp(false);
    attemptsRef.current = 0;
    warnedRef.current = false;
    connect();

    return () => {
      cleanupSocket();
    };
  }, [enabled, connect, cleanupSocket]);

  const switchSession = useCallback((sessionId: string, modelId?: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'switch_session',
          sessionId,
          modelId,
        }),
      );
    }
  }, []);

  return {
    packet,
    status,
    latencyMs,
    error,
    wsGivingUp,
    switchSession,
    reconnect: connect,
  };
}
