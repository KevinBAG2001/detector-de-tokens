import React, { useState } from 'react';
import { Droplet, ChevronUp, ChevronDown, DollarSign, Sparkles, Trash2 } from 'lucide-react';

export interface TauriTrayDockProps {
  fillPercentage: number;
  totalTokens: number;
  maxTokens: number;
  costUSD: number;
  modelName: string;
  sessionId?: string;
  severity?: 'safe' | 'warning' | 'critical';
  onFlushCache?: () => void;
}

export const TauriTrayDock: React.FC<TauriTrayDockProps> = ({
  fillPercentage = 0,
  totalTokens = 0,
  maxTokens = 2_000_000,
  costUSD = 0,
  modelName = 'Gemini 2.5 Pro',
  sessionId = 'SESSION-LOCAL',
  severity = 'safe',
  onFlushCache,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const colors = {
    safe: {
      dot: 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]',
      bar: 'from-cyan-400 to-cyan-500',
      text: 'text-cyan-300',
    },
    warning: {
      dot: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
      bar: 'from-amber-400 to-orange-500',
      text: 'text-amber-300',
    },
    critical: {
      dot: 'bg-red-500 shadow-[0_0_10px_#ef4444]',
      bar: 'from-red-500 to-rose-600',
      text: 'text-red-300',
    },
  }[severity];

  const headroom = Math.max(0, maxTokens - totalTokens);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Popover expandido hacia arriba */}
      {isOpen && (
        <div className="mb-2 w-80 p-4 rounded-2xl bg-[#0a0e15]/95 backdrop-blur-2xl border border-white/10 shadow-2xl text-slate-200 transition-all duration-300">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span className="text-xs font-bold text-slate-100">{modelName}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {sessionId.slice(0, 10)}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Headroom libre:</span>
              <span className="font-bold text-slate-200">{headroom.toLocaleString()} tok</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Saturación:</span>
              <span className={`font-bold ${colors.text}`}>{fillPercentage.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Gasto estimado:</span>
              <span className="font-bold text-amber-300">${costUSD.toFixed(4)} USD</span>
            </div>
          </div>

          {onFlushCache && (
            <button
              onClick={onFlushCache}
              className="mt-3 w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors border border-white/5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar Caché Local</span>
            </button>
          )}
        </div>
      )}

      {/* Barra de la bandeja (320x56 px dock) */}
      <div className="flex items-center gap-3 px-3.5 py-2 rounded-full bg-[#0a0e15]/95 backdrop-blur-2xl border border-white/15 shadow-2xl hover:border-white/25 transition-all duration-300">
        <div className="relative flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center">
            <Droplet className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${colors.dot}`} />
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-mono font-bold text-slate-200">
            {fillPercentage.toFixed(1)}% <span className="text-slate-400 font-normal">• {Math.round(totalTokens / 1000)}k</span>
          </span>
          <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden mt-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-500`}
              style={{ width: `${Math.max(4, Math.min(100, fillPercentage))}%` }}
            />
          </div>
        </div>

        <div className="h-4 w-[1px] bg-white/10" />

        <div className="font-mono text-xs font-bold text-amber-300 flex items-center">
          <DollarSign className="w-3 h-3 text-amber-400" />
          {costUSD.toFixed(2)}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          title="Alternar panel rápido"
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
