// @ts-nocheck
'use client';
import React from 'react';
import { LiquidGlassCard } from "@/components/ui/liquid-weather-glass";
import { Zap, Database, Cpu, AlertTriangle, Sparkles, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

export interface TokenMetricsProps {
  promptTokens: number;
  outputTokens: number;
  cachedTokens: number;
  thinkingTokens?: number;
  maxTokens: number; // e.g., 1_000_000 for Gemini 2.5
  modelName: string;
  costUSD: number;
  tpmRemaining: number;
  tpmLimit: number;
}

export const TokenLiquidCard: React.FC<TokenMetricsProps> = ({
  promptTokens = 145200,
  outputTokens = 12400,
  cachedTokens = 84000,
  thinkingTokens = 4200,
  maxTokens = 1000000,
  modelName = "Gemini 2.5 Pro (Antigravity)",
  costUSD = 0.214,
  tpmRemaining = 340000,
  tpmLimit = 500000,
}) => {
  const totalUsed = promptTokens + outputTokens + (thinkingTokens || 0);
  const fillPercentage = Math.min(100, Math.round((totalUsed / maxTokens) * 100));

  // Determine severity and colors based on user's threshold rules:
  // Safe (< 70%): Cyan/Electric blue
  // Warning (70-85%): Amber/Golden
  // Critical (> 85%): Crimson/Lava red
  let liquidColor = 'from-cyan-500/40 via-blue-600/30 to-indigo-600/40';
  let glowColor = 'shadow-[0_0_30px_rgba(0,240,255,0.3)]';
  let badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
  let statusText = 'Capacidad Óptima';

  if (fillPercentage >= 85) {
    liquidColor = 'from-red-600/50 via-rose-600/40 to-orange-600/50';
    glowColor = 'shadow-[0_0_40px_rgba(239,68,68,0.5)]';
    badgeColor = 'bg-red-500/20 text-red-300 border-red-500/40';
    statusText = 'Atención: Saturación Inminente';
  } else if (fillPercentage >= 70) {
    liquidColor = 'from-amber-500/40 via-yellow-600/35 to-orange-500/40';
    glowColor = 'shadow-[0_0_35px_rgba(245,158,11,0.4)]';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    statusText = 'Umbral de Alerta';
  }

  return (
    <LiquidGlassCard
      draggable={true}
      expandable={true}
      width="420px"
      expandedWidth="480px"
      borderRadius="28px"
      blurIntensity="xl"
      shadowIntensity="lg"
      glowIntensity="md"
      className={`p-6 text-white border border-white/10 bg-slate-950/40 overflow-hidden select-none transition-shadow duration-500 ${glowColor}`}
    >
      {/* Dynamic Animated Liquid Wave Fill Background */}
      <div 
        className="absolute inset-x-0 bottom-0 pointer-events-none transition-all duration-700 ease-out z-0"
        style={{ height: `${fillPercentage}%` }}
      >
        <div className={`w-full h-full bg-gradient-to-t ${liquidColor} backdrop-blur-md relative`}>
          {/* Surface wave shimmer */}
          <motion.div 
            animate={{ x: [-20, 20, -20] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute top-0 inset-x-0 h-2 bg-white/40 blur-xs"
          />
        </div>
      </div>

      {/* Card Content Header */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90">{modelName}</h3>
            <span className="text-xs text-white/50">Sesión Activa Antigravity</span>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[11px] font-medium border backdrop-blur-md ${badgeColor}`}>
          {statusText}
        </div>
      </div>

      {/* Main Liquid Level Metric */}
      <div className="relative z-10 my-4 flex items-baseline justify-between">
        <div>
          <span className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-white/70">
            {fillPercentage}%
          </span>
          <span className="ml-2 text-xs text-white/60 font-medium">Ventana Ocupada</span>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-white/80">
            {(totalUsed / 1000).toFixed(1)}k / {(maxTokens / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-white/40">Tokens Acumulados</div>
        </div>
      </div>

      {/* Granular Breakdown (Domain: GranularTokenCount) */}
      <div className="relative z-10 grid grid-cols-2 gap-2 my-4 pt-3 border-t border-white/10 text-xs">
        <div className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center gap-1.5 text-white/70">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Prompt:</span>
          </div>
          <span className="font-mono font-medium text-white/90">{(promptTokens / 1000).toFixed(1)}k</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center gap-1.5 text-white/70">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Output:</span>
          </div>
          <span className="font-mono font-medium text-white/90">{(outputTokens / 1000).toFixed(1)}k</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center gap-1.5 text-white/70">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>En Caché:</span>
          </div>
          <span className="font-mono font-medium text-emerald-300">{(cachedTokens / 1000).toFixed(1)}k</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center gap-1.5 text-white/70">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>Costo Est.:</span>
          </div>
          <span className="font-mono font-medium text-amber-300">${costUSD.toFixed(3)}</span>
        </div>
      </div>

      {/* Footer Rate Limits */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-white/50 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1">
          <span>TPM Disponible:</span>
          <span className="font-mono text-white/80">{(tpmRemaining / 1000).toFixed(0)}k / {(tpmLimit / 1000).toFixed(0)}k</span>
        </div>
        <div className="text-[10px] text-white/40 italic">
          Click para expandir • Arrastrar para mover
        </div>
      </div>
    </LiquidGlassCard>
  );
};
