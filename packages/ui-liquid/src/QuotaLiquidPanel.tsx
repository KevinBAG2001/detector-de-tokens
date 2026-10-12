import React from 'react';
import type { QuotaDotTone } from './HotbarPillDock';

export interface QuotaLiquidPanelProps {
  estado: QuotaDotTone;
  estadoLabel: string;
  detail: string;
  kicker?: string;
  sourceNote?: string;
  compact?: boolean;
}

const borderByEstado: Record<QuotaDotTone, string> = {
  agotado: 'border-red-500/35 bg-red-950/25',
  disponible: 'border-emerald-500/25 bg-emerald-950/15',
  desconocido: 'border-slate-500/30 bg-slate-900/40',
};

export const QuotaLiquidPanel: React.FC<QuotaLiquidPanelProps> = ({
  estado,
  estadoLabel,
  detail,
  kicker = 'Uso semanal (inferido)',
  sourceNote = 'Derivado de logs locales del IDE Antigravity; no incluye porcentaje ni límite oficial.',
  compact = false,
}) => {
  return (
    <div
      className={`rounded-2xl border px-3 py-2.5 ${borderByEstado[estado]} ${compact ? 'text-[11px]' : 'text-xs'}`}
      aria-label="Cuota individual Antigravity"
    >
      <p className="text-[9px] font-mono uppercase tracking-wider text-slate-500">{kicker}</p>
      <p className="font-semibold text-slate-100 mt-0.5">{estadoLabel}</p>
      <p className="text-slate-400 mt-1 leading-snug">{detail}</p>
      <p className="text-[10px] text-slate-500 mt-2 leading-snug">{sourceNote}</p>
    </div>
  );
};
