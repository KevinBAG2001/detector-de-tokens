import React from 'react';
import { Cpu, Database, Sparkles, Activity } from 'lucide-react';
import { formatTokenCountEs } from './lib/utils';

export interface TokenGranularBreakdownProps {
  prompt: number | null;
  output: number | null;
  cached: number | null;
  thinking: number | null;
  total: number | null;
  compact?: boolean;
}

function cell(value: number | null): string {
  if (value === null) return 'Sin dato';
  return formatTokenCountEs(value);
}

export const TokenGranularBreakdown: React.FC<TokenGranularBreakdownProps> = ({
  prompt,
  output,
  cached,
  thinking,
  total,
  compact = false,
}) => {
  const pad = compact ? 'p-3' : 'p-4';
  return (
    <div className={`rounded-2xl glass-panel ${pad} space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-slate-200 shrink-0">Desglose de tokens</h3>
        <span className="text-[10px] font-mono text-slate-500 text-right leading-tight">
          Solo datos locales
        </span>
      </div>
      <dl className={`grid grid-cols-2 gap-2 ${compact ? 'text-[11px]' : 'text-xs'}`}>
        <Row icon={<Cpu className="w-3.5 h-3.5 text-indigo-400" />} label="Prompt" value={cell(prompt)} />
        <Row icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />} label="Output" value={cell(output)} />
        <Row icon={<Database className="w-3.5 h-3.5 text-emerald-400" />} label="Cached" value={cell(cached)} />
        <Row icon={<Activity className="w-3.5 h-3.5 text-violet-400" />} label="Thinking" value={cell(thinking)} />
      </dl>
      <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Total</span>
        <span className="font-mono font-bold text-cyan-200">{cell(total)}</span>
      </div>
    </div>
  );
};

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/25 border border-white/5 min-w-0">
      <div className="flex items-center gap-1.5 text-slate-400 min-w-0 shrink">
        <span className="shrink-0">{icon}</span>
        <dt className="truncate">{label}</dt>
      </div>
      <dd className="font-mono text-slate-100 shrink-0 text-right">{value}</dd>
    </div>
  );
}
