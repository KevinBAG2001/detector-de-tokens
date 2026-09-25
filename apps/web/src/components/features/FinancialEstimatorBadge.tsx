import React from 'react';
import { DollarSign, PiggyBank, Receipt, Sparkles } from 'lucide-react';

interface FinancialEstimatorBadgeProps {
  costUSD: number;
  savingsUSD?: number;
  modelId: 'gemini-2.5-pro' | 'gemini-2.5-flash';
}

export const FinancialEstimatorBadge: React.FC<FinancialEstimatorBadgeProps> = ({
  costUSD,
  savingsUSD = 0,
  modelId,
}) => {
  const isPro = modelId.includes('pro');

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white/95">Estimador Financiero de Costos</h2>
            <p className="text-xs text-white/50">Telemetría monetaria acumulada en USD ($)</p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 text-white/60">
          Tarifario Oficial Google AI
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center justify-between glass-panel-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-white/50">Costo Actual de Sesión</div>
              <div className="text-2xl font-mono font-extrabold text-amber-300">
                ${costUSD.toFixed(4)} <span className="text-xs text-white/40 font-normal">USD</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center justify-between glass-panel-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-white/50">Ahorro por Reutilización de Caché</div>
              <div className="text-2xl font-mono font-extrabold text-emerald-400">
                ${savingsUSD.toFixed(4)} <span className="text-xs text-white/40 font-normal">USD</span>
              </div>
            </div>
          </div>
          {savingsUSD > 0 && (
            <div className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Optimizado
            </div>
          )}
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-900/30 border border-white/5 text-[11px] text-white/60 flex items-center justify-between font-mono">
        <span>Tarifa {isPro ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}:</span>
        <span>
          Input: ${isPro ? '1.25' : '0.075'}/1M • Output: ${isPro ? '5.00' : '0.30'}/1M • Caché: ${isPro ? '0.30' : '0.018'}/1M
        </span>
      </div>
    </div>
  );
};
