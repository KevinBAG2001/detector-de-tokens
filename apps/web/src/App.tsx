import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Terminal } from 'lucide-react';
import {
  HotbarPillDock,
  KineticLiquidChamber,
  TokenGranularBreakdown,
} from '@antigravity/ui-liquid';
import { useLocalBackend } from '@/application/hooks/useLocalBackend';
import { useTokenStream } from '@/application/hooks/useTokenStream';
import { tokenApi } from '@/infrastructure/HttpTokenApi';
import { HeaderStatusBar } from '@/components/features/HeaderStatusBar';

export const App: React.FC = () => {
  const { status: backendStatus, apiBaseUrl, retry: retryBackend } = useLocalBackend();
  const apiReady = backendStatus === 'available';
  const { packet, status: streamStatus, latencyMs, switchSession } = useTokenStream({
    enabled: apiReady,
  });

  const [sessions, setSessions] = useState<
    Array<{ sessionId: string; lastModified: string; sizeBytes: number }>
  >([]);
  const sessionsFetchedRef = useRef(false);

  const fetchSessions = useCallback(async () => {
    if (!apiReady) return;
    try {
      const res = await tokenApi.listarSesiones();
      if (res.exito && res.datos?.sesiones) {
        setSessions(res.datos.sesiones as typeof sessions);
      }
    } catch {
      // Sin reintentos en bucle: el banner de API ya informa al usuario.
    }
  }, [apiReady]);

  useEffect(() => {
    if (!apiReady || sessionsFetchedRef.current) return;
    sessionsFetchedRef.current = true;
    void fetchSessions();
  }, [apiReady, fetchSessions]);

  const tokens = packet?.tokens ?? null;
  const total = tokens
    ? (tokens.totalAccumulated ??
      tokens.prompt + tokens.output + tokens.cached + tokens.thinking)
    : null;

  const sessionLabel = packet?.sessionId ?? 'Sin sesión en streaming';
  const modelName = packet?.model?.name;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative overflow-x-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />

      <HeaderStatusBar
        backendStatus={backendStatus}
        streamStatus={streamStatus}
        latencyMs={latencyMs}
        activeSessionId={packet?.sessionId}
        sessions={sessions}
        onSelectSession={(sessionId) => switchSession(sessionId)}
        onRefreshSessions={() => void fetchSessions()}
        modelName={modelName}
      />

      {backendStatus === 'unavailable' && (
        <div
          className="mx-6 mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-sm text-amber-100 space-y-2"
          role="status"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">API local no disponible</p>
              <p className="text-amber-200/80 text-xs mt-1">
                No se pudo contactar con {apiBaseUrl}. La interfaz no reintentará de forma agresiva para
                evitar ruido en consola.
              </p>
              <p className="text-xs font-mono text-white/70 mt-2">
                Levanta el motor con:{' '}
                <code className="text-cyan-300">pnpm dev:server</code>
              </p>
              <button
                type="button"
                onClick={() => {
                  sessionsFetchedRef.current = false;
                  retryBackend();
                }}
                className="mt-3 text-xs px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 hover:border-cyan-500/40"
              >
                Reintentar comprobación
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg w-full mx-auto px-4 py-4 flex flex-col gap-4">
        <HotbarPillDock
          sessionLabel={sessionLabel}
          totalTokens={total}
          quotaTone="desconocido"
        />

        <KineticLiquidChamber
          compact
          totalTokens={total}
          prompt={tokens?.prompt ?? 0}
          output={tokens?.output ?? 0}
          cached={tokens?.cached ?? 0}
          thinking={tokens?.thinking ?? 0}
        />

        <TokenGranularBreakdown
          compact
          prompt={tokens?.prompt ?? null}
          output={tokens?.output ?? null}
          cached={tokens?.cached ?? null}
          thinking={tokens?.thinking ?? null}
          total={total}
        />

        {!apiReady && backendStatus === 'checking' && (
          <p className="text-center text-xs text-slate-500">Comprobando API local…</p>
        )}

        {apiReady && !packet && streamStatus !== 'connected' && (
          <p className="text-center text-xs text-slate-500">
            API en línea; esperando telemetría WebSocket…
          </p>
        )}
      </div>

      <footer className="mt-auto w-full border-t border-white/5 py-4 px-6 text-center text-xs text-white/40 flex items-center justify-center gap-2">
        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
        <span>Antigravity Liquid Token Lens · Hotbar nativo = fuente principal de datos locales</span>
      </footer>
    </div>
  );
};
