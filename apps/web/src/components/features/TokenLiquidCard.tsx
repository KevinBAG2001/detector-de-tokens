import React from 'react';
import { LiquidGlassCard } from '@/components/ui/liquid-weather-glass';
import { Zap, Database, Cpu, Sparkles, DollarSign, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export interface TokenMetricsProps {
  promptTokens: number;
  outputTokens: number;
  cachedTokens: number;
  thinkingTokens?: number;
  maxTokens: number;
  modelName: string;
  costUSD: number;
  savingsUSD?: number;
  tpmRemaining: number;
  tpmLimit: number;
  rpmRemaining?: number;
  rpmLimit?: number;
  severity?: 'safe' | 'warning' | 'critical';
  fillPercentage?: number;
}

export const TokenLiquidCard: React.FC<TokenMetricsProps> = ({
  promptTokens = 0,
  outputTokens = 0,
  cachedTokens = 0,
  thinkingTokens = 0,
  maxTokens = 2_000_000,
  modelName = "Gemini 2.5 Pro (Antigravity)",
  costUSD = 0,
  savingsUSD = 0,
  tpmRemaining = 3_820_000,
  tpmLimit = 4_000_000,
  rpmRemaining = 340,
  rpmLimit = 360,
  severity,
  fillPercentage: propFillPercentage,
}) => {
  const totalUsed = promptTokens + outputTokens + (thinkingTokens || 0) + cachedTokens;
  const calculatedPercentage = Math.min(100, Math.round((totalUsed / maxTokens) * 1000) / 10);
  const fillPercentage = propFillPercentage !== undefined ? propFillPercentage : calculatedPercentage;

  // Determinar severidad cromática
  let computedSeverity = severity;
  if (!computedSeverity) {
    if (fillPercentage >= 85) computedSeverity = 'critical';
    else if (fillPercentage >= 70) computedSeverity = 'warning';
    else computedSeverity = 'safe';
  }

  let liquidColor = 'from-cyan-500/40 via-blue-600/30 to-indigo-600/40';
  let glowColor = 'shadow-[0_0_35px_rgba(0,240,255,0.25)]';
  let badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
  let statusText = 'Capacidad Óptima';
  let waveSpeed = 4;

  if (computedSeverity === 'critical') {
    liquidColor = 'from-red-600/50 via-rose-600/40 to-orange-600/50';
    glowColor = 'shadow-[0_0_45px_rgba(239,68,68,0.45)] ring-1 ring-red-500/40 animate-pulse';
    badgeColor = 'bg-red-500/20 text-red-300 border-red-500/40';
    statusText = 'Saturación Crítica';
    waveSpeed = 1.5;
  } else if (computedSeverity === 'warning') {
    liquidColor = 'from-amber-500/40 via-yellow-600/35 to-orange-500/40';
    glowColor = 'shadow-[0_0_35px_rgba(245,158,11,0.35)]';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    statusText = 'Umbral de Alerta';
    waveSpeed = 2.5;
  }

  return (
    <LiquidGlassCard
      draggable={true}
      expandable={true}
      width="440px"
      expandedWidth="520px"
      borderRadius="28px"
      blurIntensity="xl"
      shadowIntensity="lg"
      glowIntensity="md"
      className={`p-6 text-white border border-white/10 bg-slate-950/40 overflow-hidden select-none transition-all duration-500 ${glowColor}`}
    >
      {/* Fondo de fluido líquido dinámico */}
      <div 
        className="absolute inset-x-0 bottom-0 pointer-events-none transition-all duration-700 ease-out z-0"
        style={{ height: `${Math.max(5, Math.min(100, fillPercentage))}%` }}
      >
        <div className={`w-full h-full bg-gradient-to-t ${liquidColor} backdrop-blur-md relative`}>
          {/* Ondas senoidales en la superficie */}
          <motion.div 
            animate={{ x: [-30, 30, -30] }}
            transition={{ repeat: Infinity, duration: waveSpeed, ease: "easeInOut" }}
            className="absolute top-0 inset-x-0 h-2.5 bg-white/40 blur-xs"
          />
          <motion.div 
            animate={{ x: [20, -20, 20] }}
            transition={{ repeat: Infinity, duration: waveSpeed * 1.3, ease: "easeInOut" }}
            className="absolute top-1 inset-x-0 h-1.5 bg-cyan-200/50 blur-sm"
          />
        </div>
      </div>

      {/* Encabezado de la Tarjeta */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
            <Zap className={`w-5 h-5 ${computedSeverity === 'critical' ? 'text-rose-400' : computedSeverity === 'warning' ? 'text-amber-400' : 'text-cyan-400'} animate-pulse`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/95">{modelName}</h3>
            <span className="text-[11px] text-white/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              Sesión Activa Antigravity
            </span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[11px] font-medium border backdrop-blur-md transition-colors ${badgeColor}`}>
          {statusText}
        </div>
      </div>

      {/* Métrica Principal de Ocupación */}
      <div className="relative z-10 my-4 flex items-baseline justify-between">
        <div>
          <span className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-white/70">
            {fillPercentage}%
          </span>
          <span className="ml-2 text-xs text-white/60 font-medium">Ventana Ocupada</span>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-white/90 font-semibold">
            {(totalUsed / 1000).toFixed(1)}k / {(maxTokens / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-white/40">Tokens Totales</div>
        </div>
      </div>

      {/* Desglose Granular de Tokens */}
      <div className="relative z-10 grid grid-cols-2 gap-2.5 my-4 pt-3 border-t border-white/10 text-xs">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/25 border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-1.5 text-white/70">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Prompt:</span>
          </div>
          <span className="font-mono font-medium text-white/95">{(promptTokens / 1000).toFixed(1)}k</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/25 border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-1.5 text-white/70">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Output:</span>
          </div>
          <span className="font-mono font-medium text-white/95">{(outputTokens / 1000).toFixed(1)}k</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/25 border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-1.5 text-white/70">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>En Caché:</span>
          </div>
          <span className="font-mono font-medium text-emerald-300">{(cachedTokens / 1000).toFixed(1)}k</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/25 border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-1.5 text-white/70">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Thinking:</span>
          </div>
          <span className="font-mono font-medium text-purple-300">{((thinkingTokens || 0) / 1000).toFixed(1)}k</span>
        </div>
      </div>

      {/* Resumen Financiero y Ahorros */}
      <div className="relative z-10 flex items-center justify-between p-2.5 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
        <div className="flex items-center gap-1.5 text-amber-200">
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span>Costo Sesión:</span>
          <span className="font-mono font-bold text-amber-300">${costUSD.toFixed(4)} USD</span>
        </div>
        {savingsUSD > 0 && (
          <div className="text-[11px] font-mono text-emerald-400">
            Ahorro Caché: ${savingsUSD.toFixed(4)}
          </div>
        )}
      </div>

      {/* Pie de Tarjeta: Límites de Cuota */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-white/50 pt-2 border-t border-white/10">
        <div className="flex items-center gap-1.5">
          <span>TPM:</span>
          <span className="font-mono text-white/80 font-medium">{(tpmRemaining / 1000).toFixed(0)}k / {(tpmLimit / 1000).toFixed(0)}k</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>RPM:</span>
          <span className="font-mono text-white/80 font-medium">{rpmRemaining} / {rpmLimit}</span>
        </div>
      </div>
    </LiquidGlassCard>
  );
};
