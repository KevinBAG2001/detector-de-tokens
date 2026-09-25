import { useState, useEffect, useRef, useCallback } from 'react';

export interface TokenTelemetryStreamPacket {
  eventId: string;
  timestamp: string;
  sessionId: string;
  model: {
    name: string;
    contextWindowLimit: number;
  };
  tokens: {
    prompt: number;
    output: number;
    cached: number;
    thinking: number;
    totalAccumulated: number;
  };
  gauge: {
    fillPercentage: number;
    severity: 'safe' | 'warning' | 'critical';
    liquidColorHex: string;
  };
  rateLimits: {
    tpmRemaining: number;
    tpmLimit: number;
    rpmRemaining: number;
    rpmLimit: number;
    resetInSeconds: number;
  };
  financial: {
    costUSD: number;
    savingsUSD: number;
  };
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function useTokenStream() {
  const [packet, setPacket] = useState<TokenTelemetryStreamPacket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [latencyMs, setLatencyMs] = useState<number>(12);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const wsUrl = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:3001/ws';
      setStatus('connecting');
      setError(null);

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        setError(null);

        // Ping periódico para medir latencia
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const start = performance.now();
            ws.send(JSON.stringify({ type: 'ping' }));
            (ws as any)._pingStart = start;
          }
        }, 5000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'telemetry_packet' && message.data) {
            setPacket(message.data);
          } else if (message.type === 'pong') {
            const start = (ws as any)._pingStart;
            if (start) {
              setLatencyMs(Math.round(performance.now() - start));
            }
          }
        } catch {
          // Ignorar mensajes no JSON
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
        setError('Error de comunicación con el motor de streaming');
      };

      ws.onclose = () => {
        setStatus('disconnected');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        // Intentar reconectar después de 2.5s
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2500);
      };
    } catch (err: any) {
      setStatus('disconnected');
      setError(err?.message || 'Fallo de conexión');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const switchSession = useCallback((sessionId: string, modelId?: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'switch_session',
        sessionId,
        modelId,
      }));
    }
  }, []);

  const setModel = useCallback((modelId: 'gemini-2.5-pro' | 'gemini-2.5-flash') => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'set_model',
        modelId,
      }));
    }
  }, []);

  return {
    packet,
    status,
    latencyMs,
    error,
    switchSession,
    setModel,
    reconnect: connect,
  };
}
