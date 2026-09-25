import React, { useEffect, useState } from 'react';
import { Gauge, Clock, Zap, AlertCircle } from 'lucide-react';

interface RateLimitMeterProps {
  tpmRemaining: number;
  tpmLimit: number;
  rpmRemaining: number;
  rpmLimit: number;
  resetInSeconds: number;
}

export const RateLimitMeter: React.FC<RateLimitMeterProps> = ({
  tpmRemaining,
  tpmLimit,
  rpmRemaining,
  rpmLimit,
  resetInSeconds,
}) => {
  const [countdown, setCountdown] = useState(resetInSeconds);

  useEffect(() => {
    setCountdown(resetInSeconds);
  }, [resetInSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tpmUsed = Math.max(0, tpmLimit - tpmRemaining);
  const tpmPercent = Math.min(100, Math.round((tpmUsed / (tpmLimit || 1)) * 100));

  const rpmUsed = Math.max(0, rpmLimit - rpmRemaining);
  const rpmPercent = Math.min(100, Math.round((rpmUsed / (rpmLimit || 1)) * 100));

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Gauge className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white/95">Velocidad de Cuotas (Rate Limits)</h2>
            <p className="text-xs text-white/50">Ventanas dinámicas de consumo por minuto TPM / RPM</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs text-white/70">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reseteo en:</span>
          <span className="font-mono font-bold text-cyan-300">{countdown}s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TPM Meter */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col gap-2.5 glass-panel-hover">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-white/80">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-semibold">TPM (Tokens / Minuto)</span>
            </div>
            <span className="font-mono font-semibold text-white/90">
              {(tpmRemaining / 1000).toFixed(0)}k disponibles
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
            <div
              style={{ width: `${tpmPercent}%` }}
              className={`h-full transition-all duration-500 rounded-full ${
                tpmPercent > 80 ? 'bg-rose-500' : tpmPercent > 50 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/50 font-mono">
            <span>Ocupado: {(tpmUsed / 1000).toFixed(0)}k ({tpmPercent}%)</span>
            <span>Límite: {(tpmLimit / 1000).toFixed(0)}k</span>
          </div>
        </div>

        {/* RPM Meter */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col gap-2.5 glass-panel-hover">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-white/80">
              <AlertCircle className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold">RPM (Peticiones / Minuto)</span>
            </div>
            <span className="font-mono font-semibold text-white/90">
              {rpmRemaining} disponibles
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
            <div
              style={{ width: `${rpmPercent}%` }}
              className={`h-full transition-all duration-500 rounded-full ${
                rpmPercent > 80 ? 'bg-rose-500' : rpmPercent > 50 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/50 font-mono">
            <span>Ocupado: {rpmUsed} ({rpmPercent}%)</span>
            <span>Límite: {rpmLimit} RPM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
