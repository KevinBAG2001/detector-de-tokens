import React from 'react';
import { Activity, ShieldCheck, RefreshCw, Cpu, Layers } from 'lucide-react';
import type { ConnectionStatus } from '@/application/hooks/useTokenStream';

interface HeaderStatusBarProps {
  status: ConnectionStatus;
  latencyMs: number;
  activeSessionId?: string;
  sessions: Array<{ sessionId: string; lastModified: string; sizeBytes: number }>;
  onSelectSession: (sessionId: string) => void;
  activeModel: 'gemini-2.5-pro' | 'gemini-2.5-flash';
  onSelectModel: (model: 'gemini-2.5-pro' | 'gemini-2.5-flash') => void;
  onRefreshSessions: () => void;
}

export const HeaderStatusBar: React.FC<HeaderStatusBarProps> = ({
  status,
  latencyMs,
  activeSessionId,
  sessions,
  onSelectSession,
  activeModel,
  onSelectModel,
  onRefreshSessions,
}) => {
  const isConnected = status === 'connected';

  return (
    <header className="w-full glass-panel border-b border-white/10 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
      {/* Logotipo y Título de Producto */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-white/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white/95">
              Antigravity Liquid Token Lens
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              v2.0 DDD
            </span>
          </div>
          <p className="text-[11px] text-white/50">
            Monitor Reactivo de Cuotas y Tokens On-Device • Zero-Leakage
          </p>
        </div>
      </div>

      {/* Controles de Sesión y Modelo */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Selector de Sesión de Antigravity */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
          <span className="text-white/40">Conversación:</span>
          <select
            value={activeSessionId || ''}
            onChange={(e) => onSelectSession(e.target.value)}
            className="bg-transparent text-cyan-300 font-mono text-xs focus:outline-none cursor-pointer max-w-[200px] truncate"
          >
            {sessions.map((s) => (
              <option key={s.sessionId} value={s.sessionId} className="bg-slate-900 text-white">
                {s.sessionId.substring(0, 14)}... ({new Date(s.lastModified).toLocaleTimeString()})
              </option>
            ))}
            {sessions.length === 0 && (
              <option value="" className="bg-slate-900 text-white/60">
                Sin sesiones detectadas
              </option>
            )}
          </select>
          <button
            onClick={onRefreshSessions}
            title="Refrescar sesiones"
            className="p-1 hover:text-cyan-400 text-white/40 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Selector de Modelo */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
          <button
            onClick={() => onSelectModel('gemini-2.5-pro')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeModel === 'gemini-2.5-pro'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" /> 2.5 Pro (2M)
            </span>
          </button>
          <button
            onClick={() => onSelectModel('gemini-2.5-flash')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeModel === 'gemini-2.5-flash'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" /> 2.5 Flash (1M)
            </span>
          </button>
        </div>

        {/* Indicador de Conexión y Latencia */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : status === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-mono text-white/80">
              {isConnected ? `${latencyMs}ms` : status === 'connecting' ? 'Conectando...' : 'Desconectado'}
            </span>
          </div>
          <div className="h-3 w-[1px] bg-white/10" />
          <span className="text-[11px] text-emerald-400/90 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Local
          </span>
        </div>
      </div>
    </header>
  );
};
