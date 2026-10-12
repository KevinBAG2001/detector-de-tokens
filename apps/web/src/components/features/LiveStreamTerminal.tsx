import React, { useState } from 'react';
import { Terminal, Zap, Brain, Sparkles, RefreshCw } from 'lucide-react';

export interface LiveStreamTerminalProps {
  modelName: string;
  latencyMs: number;
  totalTokens: number;
  onSimulateBurst?: (amount: number) => void;
  onSimulateThinking?: () => void;
  className?: string;
}

export const LiveStreamTerminal: React.FC<LiveStreamTerminalProps> = ({
  modelName = 'Gemini 2.5 Pro',
  latencyMs = 12,
  totalTokens = 0,
  onSimulateBurst,
  onSimulateThinking,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'telemetry'>('stream');

  return (
    <div
      className={`relative rounded-3xl p-5 bg-[#0a0e15]/90 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col justify-between ${className}`}
    >
      {/* Cabecera del terminal */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
              <span>Live Inference Telemetry</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Cluster: local-first • Latencia: {latencyMs}ms
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-300">
            CHUNK: #{Math.max(1, Math.floor(totalTokens / 48))}
          </span>
        </div>
      </div>

      {/* Contenido tipo consola / visor de streaming */}
      <div className="bg-[#05070c] rounded-2xl p-4 font-mono text-[11px] leading-relaxed text-slate-300 border border-white/5 max-h-[160px] overflow-y-auto relative">
        <div className="text-slate-500 mb-1.5 text-[10px] flex items-center justify-between">
          <span>// SESSION TARGET: {modelName}</span>
          <span>TEMP: 0.2 • TOP_P: 0.95</span>
        </div>

        <p className="text-slate-400">
          <span className="text-purple-400">&lt;thinking&gt;</span> Evaluando restricciones de ventana de contexto en tiempo real contra registros de Antigravity IDE. El token menisco sincroniza el vector de hidratación líquida a {latencyMs}ms... <span className="text-purple-400">&lt;/thinking&gt;</span>
        </p>
        <p className="mt-2 text-cyan-300">
          Inferencia completada satisfactoriamente. Se han consumido tokens de manera granular y se mantienen cuotas dentro del rango seguro de operación.
          <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1.5 animate-pulse align-middle" />
        </p>
      </div>

      {/* Botones de acción / simulación rápida */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onSimulateBurst && (
            <button
              onClick={() => onSimulateBurst(25_000)}
              className="px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Simulate +25K Burst</span>
            </button>
          )}

          {onSimulateThinking && (
            <button
              onClick={onSimulateThinking}
              className="px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-purple-300 border border-purple-500/20 text-[10px] font-mono flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Brain className="w-3 h-3 text-purple-400" />
              <span>Reasoning Heavy Chain</span>
            </button>
          )}
        </div>

        <div className="text-[10px] font-mono text-slate-500">
          Zero-Leakage: Solo telemetría numérica
        </div>
      </div>
    </div>
  );
};
