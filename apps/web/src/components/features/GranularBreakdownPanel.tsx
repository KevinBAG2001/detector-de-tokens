import React from 'react';
import { Cpu, Sparkles, Database, Activity, TrendingUp } from 'lucide-react';

interface GranularBreakdownPanelProps {
  prompt: number;
  output: number;
  cached: number;
  thinking: number;
  total: number;
  maxTokens: number;
}

export const GranularBreakdownPanel: React.FC<GranularBreakdownPanelProps> = ({
  prompt,
  output,
  cached,
  thinking,
  total,
  maxTokens,
}) => {
  const safeTotal = total > 0 ? total : 1;
  const promptPercent = Math.round((prompt / safeTotal) * 100);
  const outputPercent = Math.round((output / safeTotal) * 100);
  const cachedPercent = Math.round((cached / safeTotal) * 100);
  const thinkingPercent = Math.round((thinking / safeTotal) * 100);

  const categories = [
    {
      title: 'Prompt (Entrada & Contexto)',
      count: prompt,
      percent: promptPercent,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-400',
      icon: Cpu,
      description: 'Archivos cargados, historial previo e instrucciones de usuario.',
    },
    {
      title: 'Output (Candidatos Generados)',
      count: output,
      percent: outputPercent,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-400',
      icon: Sparkles,
      description: 'Respuestas completas, código generado y payloads de llamadas a herramientas.',
    },
    {
      title: 'En Caché (Context Caching)',
      count: cached,
      percent: cachedPercent,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      icon: Database,
      description: 'Tokens reutilizados con tarifa de descuento masivo (hasta 75% off).',
    },
    {
      title: 'Thinking (Razonamiento Interno)',
      count: thinking,
      percent: thinkingPercent,
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
      icon: Activity,
      description: 'Cadena de pensamiento y deliberación previa a la acción del agente.',
    },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white/95">Desglose Granular de Tokens</h2>
            <p className="text-xs text-white/50">Distribución compositiva del consumo por categoría DDD</p>
          </div>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 text-white/70">
          {(total / 1000).toFixed(1)}k tokens activos
        </span>
      </div>

      {/* Barra segmentada horizontal unificada */}
      <div className="w-full h-3 rounded-full bg-slate-900/80 overflow-hidden flex p-0.5 border border-white/10">
        <div style={{ width: `${promptPercent}%` }} className="h-full bg-indigo-500 rounded-l-full transition-all duration-500" title={`Prompt: ${promptPercent}%`} />
        <div style={{ width: `${outputPercent}%` }} className="h-full bg-cyan-400 transition-all duration-500" title={`Output: ${outputPercent}%`} />
        <div style={{ width: `${cachedPercent}%` }} className="h-full bg-emerald-400 transition-all duration-500" title={`Caché: ${cachedPercent}%`} />
        <div style={{ width: `${thinkingPercent}%` }} className="h-full bg-purple-500 rounded-r-full transition-all duration-500" title={`Thinking: ${thinkingPercent}%`} />
      </div>

      {/* Lista de categorías individuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.title} className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col gap-2 glass-panel-hover">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${cat.textColor}`} />
                  <span className="font-semibold text-white/90">{cat.title}</span>
                </div>
                <span className="font-mono font-bold text-white/90">
                  {cat.count.toLocaleString()}
                  <span className="text-[10px] text-white/40 ml-1">({cat.percent}%)</span>
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                <div
                  style={{ width: `${cat.percent}%` }}
                  className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                />
              </div>
              <p className="text-[11px] text-white/45 leading-relaxed">{cat.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
