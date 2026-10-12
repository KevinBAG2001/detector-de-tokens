import React from 'react';
import { Layers, RefreshCw, ShieldCheck } from 'lucide-react';
import type { ConnectionStatus } from '@/application/hooks/useTokenStream';
import type { LocalBackendStatus } from '@/application/hooks/useLocalBackend';

interface HeaderStatusBarProps {
  backendStatus: LocalBackendStatus;
  streamStatus: ConnectionStatus;
  latencyMs: number | null;
  activeSessionId?: string;
  sessions: Array<{ sessionId: string; lastModified: string; sizeBytes: number }>;
  onSelectSession: (sessionId: string) => void;
  onRefreshSessions: () => void;
  modelName?: string;
}

export const HeaderStatusBar: React.FC<HeaderStatusBarProps> = ({
  backendStatus,
  streamStatus,
  latencyMs,
  activeSessionId,
  sessions,
  onSelectSession,
  onRefreshSessions,
  modelName,
}) => {
  const streamConnected = streamStatus === 'connected';
  const apiReady = backendStatus === 'available';

  return (
    <header className="w-full glass-panel border-b border-white/10 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-white/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white/95">Antigravity Liquid Token Lens</h1>
          <p className="text-[11px] text-white/50">Vista web secundaria · datos solo desde API local</p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-3 text-xs">
        {apiReady && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10">
            <span className="text-white/40">Conversación:</span>
            <select
              value={activeSessionId || ''}
              onChange={(e) => onSelectSession(e.target.value)}
              className="bg-transparent text-cyan-300 font-mono text-xs focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {sessions.map((s) => (
                <option key={s.sessionId} value={s.sessionId} className="bg-slate-900 text-white">
                  {s.sessionId.substring(0, 14)}… ({new Date(s.lastModified).toLocaleTimeString()})
                </option>
              ))}
              {sessions.length === 0 && (
                <option value="" className="bg-slate-900 text-white/60">
                  Sin sesiones detectadas
                </option>
              )}
            </select>
            <button
              type="button"
              onClick={onRefreshSessions}
              title="Refrescar sesiones"
              className="p-1 hover:text-cyan-400 text-white/40 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {modelName && (
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 font-mono text-cyan-200">
            {modelName}
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              !apiReady
                ? backendStatus === 'checking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
                : streamConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : streamStatus === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
            }`}
          />
          <span className="font-mono text-white/80">
            {!apiReady
              ? backendStatus === 'checking'
                ? 'Comprobando API…'
                : 'API local no disponible'
              : streamConnected && latencyMs !== null
                ? `${latencyMs}ms`
                : streamStatus === 'connecting'
                  ? 'Conectando WS…'
                  : 'WS desconectado'}
          </span>
          <div className="h-3 w-px bg-white/10" />
          <span className="text-[11px] text-emerald-400/90 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Local
          </span>
        </div>
      </div>
    </header>
  );
};
