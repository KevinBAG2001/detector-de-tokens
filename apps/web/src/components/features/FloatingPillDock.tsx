import React from 'react';
import { Sparkles, Trash2, Pause, Play, Maximize2, Minimize2, DollarSign } from 'lucide-react';

export interface FloatingPillDockProps {
  modelName: string;
  fillPercentage: number;
  costUSD: number;
  isStreamPaused?: boolean;
  isExpanded?: boolean;
  severity?: 'safe' | 'warning' | 'critical';
  onFlushCache?: () => void;
  onTogglePause?: () => void;
  onToggleExpand?: () => void;
}

export const FloatingPillDock: React.FC<FloatingPillDockProps> = ({
  modelName = 'Gemini 2.5 Pro',
  fillPercentage = 0,
  costUSD = 0,
  isStreamPaused = false,
  isExpanded = true,
  severity = 'safe',
  onFlushCache,
  onTogglePause,
  onToggleExpand,
}) => {
  const statusColor = {
    safe: {
      dot: 'bg-cyan-400 shadow-[0_0_12px_#00f0ff]',
      bar: 'from-cyan-400 to-cyan-600',
      text: 'text-cyan-300',
    },
    warning: {
      dot: 'bg-amber-400 shadow-[0_0_12px_#f59e0b]',
      bar: 'from-amber-400 to-orange-500',
      text: 'text-amber-300',
    },
    critical: {
      dot: 'bg-red-500 shadow-[0_0_14px_#ef4444]',
      bar: 'from-red-500 to-rose-600',
      text: 'text-red-300',
    },
  }[severity];

  return (
    <div className="w-full flex justify-center py-2 pointer-events-none sticky top-16 z-30">
      <div className="pointer-events-auto flex items-center gap-3 sm:gap-4 px-4 py-2 rounded-full bg-[#0a0e15]/90 backdrop-blur-2xl shadow-2xl border border-white/10 transition-all duration-300 hover:scale-[1.01]">
        {/* Glow Orb & Model Name */}
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor.dot} animate-pulse`} />
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Reservoir
            </span>
            <span className="text-xs font-bold text-slate-200 tracking-tight whitespace-nowrap">
              {modelName}
            </span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-white/10" />

        {/* Mini Liquid Capsule Gauge */}
        <div className="flex items-center gap-2">
          <div className="w-20 sm:w-28 h-3.5 rounded-full bg-slate-800/80 p-0.5 overflow-hidden relative">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${statusColor.bar} transition-all duration-500 relative`}
              style={{ width: `${Math.max(4, Math.min(100, fillPercentage))}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 blur-[1px]" />
            </div>
          </div>
          <span className={`text-xs font-mono font-bold ${statusColor.text}`}>
            {fillPercentage.toFixed(1)}%
          </span>
        </div>

        <div className="h-5 w-[1px] bg-white/10 hidden sm:block" />

        {/* Live USD Burn */}
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs">
          <span className="text-[9px] text-slate-400 uppercase">Burn</span>
          <span className="font-bold text-amber-300 flex items-center">
            <DollarSign className="w-3 h-3 text-amber-400" />
            {costUSD.toFixed(4)}
          </span>
        </div>

        <div className="h-5 w-[1px] bg-white/10" />

        {/* Quick Micro Actions */}
        <div className="flex items-center gap-1.5">
          {onFlushCache && (
            <button
              onClick={onFlushCache}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 text-[10px] font-mono flex items-center gap-1 transition-all border border-white/5"
              title="Liberar memoria del contexto cacheado"
            >
              <Trash2 className="w-3 h-3 text-cyan-400" />
              <span className="hidden md:inline">Flush Cache</span>
            </button>
          )}

          {onTogglePause && (
            <button
              onClick={onTogglePause}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-amber-300 text-[10px] font-mono flex items-center gap-1 transition-all border border-white/5"
              title={isStreamPaused ? 'Reanudar telemetría' : 'Pausar telemetría'}
            >
              {isStreamPaused ? (
                <>
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span className="hidden md:inline">Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 text-amber-400" />
                  <span className="hidden md:inline">Pause</span>
                </>
              )}
            </button>
          )}

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="w-7 h-7 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 flex items-center justify-center transition-all border border-cyan-500/30"
              title={isExpanded ? 'Colapsar HUD' : 'Expandir HUD'}
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
