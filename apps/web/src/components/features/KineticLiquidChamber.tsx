import React, { useId, useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { Droplet, Activity, Zap } from 'lucide-react';

export interface KineticLiquidChamberProps {
  fillPercentage: number;
  totalTokens: number;
  maxTokens: number;
  severity?: 'safe' | 'warning' | 'critical';
  velocityTokPerSec?: number;
  compressionRatio?: number;
  cacheSavingsPct?: number;
  className?: string;
  onTriggerRipple?: () => void;
}

export const KineticLiquidChamber: React.FC<KineticLiquidChamberProps> = ({
  fillPercentage = 0,
  totalTokens = 0,
  maxTokens = 2_000_000,
  severity,
  velocityTokPerSec = 148,
  compressionRatio = 3.8,
  cacheSavingsPct = 82,
  className = '',
}) => {
  const [rippling, setRippling] = useState(false);
  const clipId = useId();

  // Severidad cromática
  let computedSeverity = severity;
  if (!computedSeverity) {
    if (fillPercentage >= 85) computedSeverity = 'critical';
    else if (fillPercentage >= 70) computedSeverity = 'warning';
    else computedSeverity = 'safe';
  }

  // Física de resorte suave para el nivel del fluido
  const springPercentage = useSpring(Math.max(4, Math.min(100, fillPercentage)), {
    stiffness: 90,
    damping: 18,
    mass: 0.8,
  });

  useEffect(() => {
    springPercentage.set(Math.max(4, Math.min(100, fillPercentage)));
    // Trigger ripple on change
    setRippling(true);
    const timer = setTimeout(() => setRippling(false), 1200);
    return () => clearTimeout(timer);
  }, [fillPercentage, springPercentage]);

  const heightStyle = useTransform(springPercentage, (v) => `${v}%`);

  // Colores según semáforo
  const theme = {
    safe: {
      primaryColor: '#00F0FF',
      wavePrimary: 'rgba(0, 240, 255, 0.45)',
      waveSecondary: 'rgba(0, 219, 233, 0.35)',
      waveTertiary: 'rgba(219, 252, 255, 0.2)',
      crestColor: '#00F0FF',
      glowShadow: '0 0 40px rgba(0,240,255,0.2)',
      ambientBottom: 'bg-[#00F0FF]/30',
      badgeBorder: 'border-cyan-400/30 text-cyan-300',
      textMetric: 'text-cyan-200',
      pingDot: 'bg-[#00F0FF]',
    },
    warning: {
      primaryColor: '#F59E0B',
      wavePrimary: 'rgba(245, 158, 11, 0.5)',
      waveSecondary: 'rgba(238, 152, 0, 0.4)',
      waveTertiary: 'rgba(255, 221, 184, 0.25)',
      crestColor: '#F59E0B',
      glowShadow: '0 0 45px rgba(245,158,11,0.28)',
      ambientBottom: 'bg-amber-500/35',
      badgeBorder: 'border-amber-400/40 text-amber-300',
      textMetric: 'text-amber-200',
      pingDot: 'bg-amber-400',
    },
    critical: {
      primaryColor: '#EF4444',
      wavePrimary: 'rgba(239, 68, 68, 0.55)',
      waveSecondary: 'rgba(255, 180, 171, 0.4)',
      waveTertiary: 'rgba(255, 206, 202, 0.25)',
      crestColor: '#EF4444',
      glowShadow: '0 0 50px rgba(239,68,68,0.38)',
      ambientBottom: 'bg-red-500/40',
      badgeBorder: 'border-red-400/50 text-red-300',
      textMetric: 'text-red-200',
      pingDot: 'bg-red-400',
    },
  }[computedSeverity];

  const headroomTokens = Math.max(0, maxTokens - totalTokens);

  return (
    <div
      className={`relative rounded-3xl p-6 bg-[#0f131b]/85 backdrop-blur-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col justify-between ${className}`}
      style={{
        boxShadow: `inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 20px 40px -15px rgba(0,0,0,0.7), ${theme.glowShadow}`,
      }}
    >
      {/* Luz rasante superior de horizonte */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

      {/* Cabecera del depósito */}
      <div className="flex items-center justify-between z-10 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center">
            <Droplet className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Primary Context Reservoir
            </div>
            <div className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
              <span>{Math.round(maxTokens / 1000)}K Hyper-Token Buffer</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border text-[10px] font-mono tracking-wider transition-colors duration-500 ${theme.badgeBorder}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${theme.pingDot} animate-ping`} />
            KINETIC MENISCUS
          </span>
        </div>
      </div>

      {/* Cámara cilíndrica central de cristal */}
      <div className="relative my-2 w-full flex items-center justify-center">
        {/* Contenedor esférico / cilíndrico de cristal */}
        <div
          className="relative w-64 sm:w-72 h-64 sm:h-72 rounded-full p-2 bg-gradient-to-b from-slate-800/40 to-slate-950/70 backdrop-blur-xl flex items-center justify-center overflow-hidden border border-white/10 transition-all duration-700"
          style={{
            boxShadow: `inset 0 2px 12px rgba(255,255,255,0.2), 0 20px 50px rgba(0,0,0,0.85), ${theme.glowShadow}`,
          }}
        >
          {/* Anillos concéntricos de refracción óptica */}
          <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none" />
          <div className="absolute inset-[6px] rounded-full shadow-[inset_0_0_24px_rgba(0,0,0,0.95),inset_0_1px_2px_rgba(255,255,255,0.4)] pointer-events-none z-30" />

          {/* Resplandor ambiental inferior */}
          <div
            className={`absolute -bottom-8 left-1/4 right-1/4 h-24 rounded-full ${theme.ambientBottom} blur-2xl pointer-events-none transition-colors duration-700 z-10`}
          />

          {/* Interior del depósito con cuadrícula y marcas */}
          <div className="relative w-full h-full rounded-full overflow-hidden bg-[#0a0e15]/95 flex flex-col justify-end">
            {/* Cuadrícula de profundidad */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none z-0" />

            {/* Marcas de escala cilíndrica */}
            <div className="absolute left-4 top-10 bottom-10 w-2 flex flex-col justify-between pointer-events-none z-10 opacity-30 text-[8px] text-slate-400 font-mono">
              <div className="border-t border-white/60 w-3" />
              <div className="border-t border-white/30 w-2" />
              <div className="border-t border-white/60 w-3" />
              <div className="border-t border-white/30 w-2" />
              <div className="border-t border-white/60 w-3" />
            </div>
            <div className="absolute right-4 top-10 bottom-10 w-2 flex flex-col justify-between items-end pointer-events-none z-10 opacity-30 text-[8px] text-slate-400 font-mono">
              <div className="border-t border-white/60 w-3" />
              <div className="border-t border-white/30 w-2" />
              <div className="border-t border-white/60 w-3" />
              <div className="border-t border-white/30 w-2" />
              <div className="border-t border-white/60 w-3" />
            </div>

            {/* Capa de ondas de choque concéntricas (Ripples) */}
            {rippling && (
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex items-center justify-center">
                <div
                  className="rounded-full border border-cyan-300/80 ripple-ring-active"
                  style={{ width: '120px', height: '120px' }}
                />
              </div>
            )}

            {/* Cuerpo del fluido con animación senoidal y altura reactiva */}
            <motion.div
              className="relative w-full will-change-[height] flex flex-col justify-end overflow-hidden"
              style={{ height: heightStyle }}
            >
              {/* Resalte especular en la cresta de la onda */}
              <div className="absolute -top-3 left-0 right-0 h-6 z-20 pointer-events-none will-change-transform">
                <svg
                  className="w-full h-full drop-shadow-[0_-2px_8px_currentColor]"
                  style={{ color: theme.crestColor }}
                  preserveAspectRatio="none"
                  viewBox="0 0 100 20"
                >
                  <defs>
                    <linearGradient id={`crest-${clipId}`} x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                      <stop offset="35%" stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="65%" stopColor="currentColor" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  <path d="M0,10 Q25,2 50,10 T100,10 L100,20 L0,20 Z" fill="currentColor" opacity="0.25" />
                  <path
                    d="M0,8 Q25,16 50,8 T100,8"
                    fill="none"
                    opacity="0.95"
                    stroke={`url(#crest-${clipId})`}
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>

              {/* Cáusticos de luz en el interior */}
              <div className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay animate-caustic opacity-30">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 200">
                  <path
                    d="M10 20 Q 50 80, 90 20 T 170 30 Q 140 100, 190 140 T 110 180 Q 70 120, 20 170 Z"
                    fill="none"
                    opacity="0.6"
                    stroke="#ffffff"
                    strokeDasharray="4,6"
                    strokeWidth="1.8"
                  />
                  <ellipse cx="100" cy="110" rx="60" ry="35" fill="none" opacity="0.4" stroke="#ffffff" strokeWidth="1.2" />
                </svg>
              </div>

              {/* Onda primaria senoidal */}
              <div className="w-[200%] h-full absolute -bottom-1 -left-[50%] opacity-85 animate-wave-slow transition-colors duration-700">
                <svg className="w-full h-full" style={{ fill: theme.wavePrimary }} preserveAspectRatio="none" viewBox="0 0 500 150">
                  <path d="M0.00,49.98 C150.00,140.00 349.81,-40.00 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" />
                </svg>
              </div>

              {/* Onda secundaria en contrafase */}
              <div className="w-[200%] h-full absolute -bottom-2 -left-[30%] opacity-65 animate-wave-fast transition-colors duration-700">
                <svg className="w-full h-full" style={{ fill: theme.waveSecondary }} preserveAspectRatio="none" viewBox="0 0 500 150">
                  <path d="M0.00,49.98 C180.20,-20.00 300.00,120.00 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" />
                </svg>
              </div>

              {/* Onda terciaria profunda */}
              <div className="w-[200%] h-full absolute -bottom-3 -left-[10%] opacity-40 animate-wave-slow transition-colors duration-700">
                <svg className="w-full h-full" style={{ fill: theme.waveTertiary }} preserveAspectRatio="none" viewBox="0 0 500 150">
                  <path d="M0.00,30 C120,80 320,10 500,50 L500,150 L0,150 Z" />
                </svg>
              </div>

              {/* Relleno de degradado de fondo */}
              <div
                className="w-full h-full transition-all duration-700"
                style={{
                  background: `linear-gradient(to top, ${theme.primaryColor}88 0%, ${theme.primaryColor}33 60%, transparent 100%)`,
                }}
              />

              {/* Micro-burbujas en suspensión */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                <div className="absolute left-[22%] bottom-0 w-2 h-2 rounded-full bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.8)] bubble-1" />
                <div className="absolute left-[45%] bottom-0 w-1.5 h-1.5 rounded-full bg-cyan-200/80 shadow-[0_0_4px_rgba(0,240,255,0.7)] bubble-2" />
                <div className="absolute left-[68%] bottom-0 w-2.5 h-2.5 rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.6)] bubble-3" />
                <div className="absolute left-[82%] bottom-0 w-1.5 h-1.5 rounded-full bg-white/50 bubble-4" />
              </div>
            </motion.div>

            {/* Lectura de Métrica Central Flotante (Hero Readout) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
              <span className="text-[10px] font-mono tracking-widest text-slate-300 uppercase opacity-80 mb-0.5">
                Utilization Ratio
              </span>
              <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-mono drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] ${theme.textMetric}`}>
                {fillPercentage.toFixed(1)}%
              </span>
              <div className="mt-1 px-3 py-0.5 rounded-full bg-slate-950/70 border border-white/10 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 backdrop-blur-md">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>
                  {totalTokens.toLocaleString()} / {maxTokens.toLocaleString()} tok
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas al pie de la tarjeta: Headroom, Velocity, Compression */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5 z-10 text-center">
        <div className="p-2 rounded-xl bg-slate-900/50 border border-white/5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Headroom</div>
          <div className="text-xs sm:text-sm font-bold text-slate-200 font-mono mt-0.5">
            {headroomTokens.toLocaleString()} tok
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {((headroomTokens / maxTokens) * 100).toFixed(1)}% libre
          </div>
        </div>

        <div className="p-2 rounded-xl bg-slate-900/50 border border-white/5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Velocidad</div>
          <div className="text-xs sm:text-sm font-bold text-cyan-300 font-mono mt-0.5 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            {velocityTokPerSec} tok/s
          </div>
          <div className="text-[10px] text-cyan-400/80 mt-0.5">Streaming activo</div>
        </div>

        <div className="p-2 rounded-xl bg-slate-900/50 border border-white/5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Compresión</div>
          <div className="text-xs sm:text-sm font-bold text-amber-300 font-mono mt-0.5">
            {compressionRatio}x Ratio
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {cacheSavingsPct}% cache hit
          </div>
        </div>
      </div>
    </div>
  );
};
