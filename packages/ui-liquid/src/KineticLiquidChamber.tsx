import React, { useEffect, useMemo, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { Droplet } from 'lucide-react';
import { formatTokenCountEs } from './lib/utils';

export interface KineticLiquidChamberProps {
  totalTokens: number | null;
  prompt?: number | null;
  output?: number | null;
  cached?: number | null;
  thinking?: number | null;
  /** Vista compacta para overlay hotbar (~360px) */
  compact?: boolean;
  className?: string;
}

/** Altura del fluido derivada solo del reparto real de tokens (sin ventana 2M ni %). */
function compositionFillLevel(
  prompt: number,
  output: number,
  cached: number,
  thinking: number,
  total: number,
): number {
  if (total <= 0) return 8;
  const dominant = Math.max(prompt, output, cached, thinking);
  return 18 + Math.round((dominant / total) * 52);
}

export const KineticLiquidChamber: React.FC<KineticLiquidChamberProps> = ({
  totalTokens,
  prompt = null,
  output = null,
  cached = null,
  thinking = null,
  compact = false,
  className = '',
}) => {
  const [rippling, setRippling] = useState(false);
  const hasSeries = totalTokens !== null;
  const total = totalTokens ?? 0;
  const p = prompt ?? 0;
  const o = output ?? 0;
  const c = cached ?? 0;
  const th = thinking ?? 0;
  const fillLevel =
    hasSeries && total > 0 ? compositionFillLevel(p, o, c, th, total) : 8;

  const springPercentage = useSpring(fillLevel, {
    stiffness: 90,
    damping: 18,
    mass: 0.8,
  });

  useEffect(() => {
    springPercentage.set(fillLevel);
    setRippling(true);
    const timer = window.setTimeout(() => setRippling(false), 1200);
    return () => window.clearTimeout(timer);
  }, [fillLevel, springPercentage]);

  const heightStyle = useTransform(springPercentage, (v) => `${v}%`);

  const theme = useMemo(() => {
    const cachedShare = total > 0 ? c / total : 0;
    if (cachedShare > 0.45) {
      return {
        primaryColor: '#34D399',
        wavePrimary: 'rgba(52, 211, 153, 0.45)',
        glowShadow: compact ? 'none' : '0 0 28px rgba(52,211,153,0.15)',
        badgeBorder: 'border-emerald-400/30 text-emerald-300',
        textMetric: 'text-emerald-200',
        pingDot: 'bg-emerald-400',
      };
    }
    return {
      primaryColor: '#00F0FF',
      wavePrimary: 'rgba(0, 240, 255, 0.45)',
      glowShadow: compact ? 'none' : '0 0 28px rgba(0,240,255,0.15)',
      badgeBorder: 'border-cyan-400/30 text-cyan-300',
      textMetric: 'text-cyan-200',
      pingDot: 'bg-[#00F0FF]',
    };
  }, [c, total, compact]);

  const chamberSize = compact ? 'w-[7.5rem] h-[7.5rem]' : 'w-64 sm:w-72 h-64 sm:h-72';
  const cardPad = compact ? 'p-2.5' : 'p-4 sm:p-5';

  const cardShadow = compact
    ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 20px -10px rgba(0,0,0,0.55)'
    : `inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 16px 32px -12px rgba(0,0,0,0.65)${theme.glowShadow !== 'none' ? `, ${theme.glowShadow}` : ''}`;

  return (
    <div
      className={`relative max-w-full rounded-2xl ${cardPad} bg-[#0f131b]/95 backdrop-blur-xl border border-white/10 overflow-hidden flex flex-col isolate ${className}`}
      style={{ boxShadow: cardShadow }}
    >
      <div className="flex items-center justify-between z-10 mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 shrink-0 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center">
            <Droplet className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">
              Cámara líquida
            </div>
            <div className="text-xs font-semibold text-slate-100 truncate">Antigravity</div>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border text-[9px] font-mono ${theme.badgeBorder}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${theme.pingDot}`} />
          LOCAL
        </span>
      </div>

      <div className="relative w-full max-w-full flex items-center justify-center overflow-hidden">
        <div
          className={`relative ${chamberSize} max-w-full shrink-0 rounded-full p-1.5 bg-gradient-to-b from-slate-800/40 to-slate-950/70 border border-white/10 overflow-hidden`}
          style={{
            boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.15), inset 0 -8px 16px rgba(0,0,0,0.5)',
          }}
        >
          <div className="relative w-full h-full rounded-full overflow-hidden bg-[#0a0e15]/95 flex flex-col justify-end">
            {rippling && (
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex items-center justify-center">
                <div
                  className="rounded-full border border-cyan-300/60 ripple-ring-active"
                  style={{ width: '64px', height: '64px' }}
                />
              </div>
            )}

            <motion.div
              className="relative w-full overflow-hidden flex flex-col justify-end"
              style={{ height: heightStyle }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 h-full opacity-80 animate-wave-slow"
                  style={{ maxWidth: '100%' }}
                >
                  <svg
                    className="w-full h-full"
                    style={{ fill: theme.wavePrimary }}
                    preserveAspectRatio="none"
                    viewBox="0 0 500 150"
                  >
                    <path d="M0.00,49.98 C150.00,140.00 349.81,-40.00 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" />
                  </svg>
                </div>
              </div>
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(to top, ${theme.primaryColor}77 0%, ${theme.primaryColor}22 70%, transparent 100%)`,
                }}
              />
            </motion.div>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 px-1 text-center">
              <span className="text-[8px] font-mono tracking-wider text-slate-400 uppercase leading-tight">
                Tokens acumulados
              </span>
              <span
                className={`text-lg font-extrabold font-mono leading-tight ${theme.textMetric}`}
              >
                {!hasSeries ? 'Sin dato' : formatTokenCountEs(total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-4'} gap-1.5 pt-2 mt-1 border-t border-white/5 z-10 text-center text-[9px] font-mono`}
      >
        <MetricChip label="Prompt" value={prompt} unknown={!hasSeries} accent="text-slate-200" />
        <MetricChip label="Output" value={output} unknown={!hasSeries} accent="text-slate-200" />
        <MetricChip label="Cached" value={cached} unknown={!hasSeries} accent="text-emerald-300" />
        <MetricChip label="Think" value={thinking} unknown={!hasSeries} accent="text-violet-300" />
      </div>
    </div>
  );
};

function MetricChip({
  label,
  value,
  unknown,
  accent = 'text-slate-200',
}: {
  label: string;
  value: number | null | undefined;
  unknown: boolean;
  accent?: string;
}) {
  const display =
    unknown || value === null || value === undefined ? 'Sin dato' : formatTokenCountEs(value);

  return (
    <div className="p-1.5 rounded-lg bg-slate-900/50 border border-white/5 min-w-0">
      <div className="text-slate-500 uppercase truncate">{label}</div>
      <div className={`text-[10px] font-bold mt-0.5 truncate ${unknown ? 'text-slate-500' : accent}`}>
        {display}
      </div>
    </div>
  );
}
