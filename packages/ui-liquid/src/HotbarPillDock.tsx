import React from 'react';
import { RefreshCw } from 'lucide-react';
import { formatTokenCountEs } from './lib/utils';

export type QuotaDotTone = 'agotado' | 'disponible' | 'desconocido';

export interface HotbarPillDockProps {
  sessionLabel: string;
  totalTokens: number | null;
  quotaTone: QuotaDotTone;
  loading?: boolean;
  onRefresh?: () => void;
}

const dotByTone: Record<QuotaDotTone, string> = {
  agotado: 'bg-red-500 shadow-[0_0_12px_#ef4444]',
  disponible: 'bg-cyan-400 shadow-[0_0_12px_#00f0ff]',
  desconocido: 'bg-slate-500 shadow-[0_0_8px_#64748b]',
};

export const HotbarPillDock: React.FC<HotbarPillDockProps> = ({
  sessionLabel,
  totalTokens,
  quotaTone,
  loading = false,
  onRefresh,
}) => {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0e15]/90 backdrop-blur-2xl border border-white/10 shadow-lg"
      data-tauri-drag-region
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotByTone[quotaTone]} ${loading ? 'animate-pulse' : ''}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Sesión</p>
        <p className="text-[11px] font-mono text-slate-200 truncate" title={sessionLabel}>
          {sessionLabel}
        </p>
      </div>
      <div className="h-4 w-px bg-white/10" />
      <div className="text-right">
        <p className="text-[9px] font-mono text-slate-500">Total</p>
        <p className="text-xs font-mono font-bold text-cyan-300">
          {totalTokens === null ? 'Sin dato' : formatTokenCountEs(totalTokens)}
        </p>
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="ml-1 p-1.5 rounded-full bg-slate-800/80 border border-white/10 text-slate-300 hover:text-cyan-300 disabled:opacity-50"
          title="Actualizar snapshot local"
          aria-label="Actualizar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};
