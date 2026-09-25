import React, { useEffect, useState } from 'react';
import { useTokenStream } from '@/application/hooks/useTokenStream';
import { tokenApi } from '@/infrastructure/HttpTokenApi';
import { HeaderStatusBar } from '@/components/features/HeaderStatusBar';
import { TokenLiquidCard } from '@/components/features/TokenLiquidCard';
import { GranularBreakdownPanel } from '@/components/features/GranularBreakdownPanel';
import { RateLimitMeter } from '@/components/features/RateLimitMeter';
import { FinancialEstimatorBadge } from '@/components/features/FinancialEstimatorBadge';
import { AlertTriangle, Sparkles, Terminal, Shield } from 'lucide-react';

export const App: React.FC = () => {
  const { packet, status, latencyMs, error, switchSession, setModel } = useTokenStream();
  const [sessions, setSessions] = useState<Array<{ sessionId: string; lastModified: string; sizeBytes: number }>>([]);
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-pro' | 'gemini-2.5-flash'>('gemini-2.5-pro');

  const fetchSessions = async () => {
    try {
      const res = await tokenApi.listarSesiones();
      if (res.exito && res.datos?.sesiones) {
        setSessions(res.datos.sesiones);
      }
    } catch {
      // Si el servidor aún está iniciando, reintentará
    }
  };

  useEffect(() => {
    void fetchSessions();
  }, [status]);

  const handleSelectSession = (sessionId: string) => {
    switchSession(sessionId, selectedModel);
  };

  const handleSelectModel = (model: 'gemini-2.5-pro' | 'gemini-2.5-flash') => {
    setSelectedModel(model);
    setModel(model);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Malla decorativa de luz ambiental de fondo */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />

      {/* Barra de Estado y Navegación Superior */}
      <HeaderStatusBar
        status={status}
        latencyMs={latencyMs}
        activeSessionId={packet?.sessionId}
        sessions={sessions}
        onSelectSession={handleSelectSession}
        activeModel={selectedModel}
        onSelectModel={handleSelectModel}
        onRefreshSessions={fetchSessions}
      />

      {/* Alerta de conexión si el servidor no responde */}
      {status === 'disconnected' && (
        <div className="mx-6 mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Motor de streaming desconectado. Intentando reconectar automáticamente a ws://localhost:3001/ws...</span>
          </div>
          <span className="font-mono text-[10px] text-white/50">pnpm dev:server</span>
        </div>
      )}

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 items-start relative z-10">
        {/* Columna Izquierda: Tarjeta Héroe Liquid Glass Drag & Drop */}
        <section className="w-full lg:w-[460px] flex flex-col items-center gap-4">
          <div className="flex items-center justify-between w-full px-2">
            <span className="text-xs text-white/50 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              HUD Líquido Flotante
            </span>
            <span className="text-[11px] text-white/40 font-mono">
              Física Senoidal Activa
            </span>
          </div>

          <TokenLiquidCard
            promptTokens={packet?.tokens.prompt ?? 0}
            outputTokens={packet?.tokens.output ?? 0}
            cachedTokens={packet?.tokens.cached ?? 0}
            thinkingTokens={packet?.tokens.thinking ?? 0}
            maxTokens={packet?.model.contextWindowLimit ?? 2_000_000}
            modelName={packet?.model.name ?? (selectedModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro (Antigravity)' : 'Gemini 2.5 Flash (Antigravity)')}
            costUSD={packet?.financial.costUSD ?? 0}
            savingsUSD={packet?.financial.savingsUSD ?? 0}
            tpmRemaining={packet?.rateLimits.tpmRemaining ?? 3_820_000}
            tpmLimit={packet?.rateLimits.tpmLimit ?? 4_000_000}
            rpmRemaining={packet?.rateLimits.rpmRemaining ?? 340}
            rpmLimit={packet?.rateLimits.rpmLimit ?? 360}
            severity={packet?.gauge.severity}
            fillPercentage={packet?.gauge.fillPercentage}
          />

          <div className="w-full p-3 rounded-2xl bg-slate-900/30 border border-white/5 text-[11px] text-white/40 text-center">
            💡 Puedes arrastrar la tarjeta sobre la pantalla como HUD interactivo o hacer clic para alternar tamaño.
          </div>
        </section>

        {/* Columna Derecha: Paneles de Telemetría Avanzada */}
        <section className="flex-1 w-full flex flex-col gap-6">
          {/* Desglose Granular */}
          <GranularBreakdownPanel
            prompt={packet?.tokens.prompt ?? 0}
            output={packet?.tokens.output ?? 0}
            cached={packet?.tokens.cached ?? 0}
            thinking={packet?.tokens.thinking ?? 0}
            total={packet?.tokens.totalAccumulated ?? 0}
            maxTokens={packet?.model.contextWindowLimit ?? 2_000_000}
          />

          {/* Medidores de Velocidad de Cuota (Rate Limits) */}
          <RateLimitMeter
            tpmRemaining={packet?.rateLimits.tpmRemaining ?? 3_820_000}
            tpmLimit={packet?.rateLimits.tpmLimit ?? 4_000_000}
            rpmRemaining={packet?.rateLimits.rpmRemaining ?? 340}
            rpmLimit={packet?.rateLimits.rpmLimit ?? 360}
            resetInSeconds={packet?.rateLimits.resetInSeconds ?? 38}
          />

          {/* Estimador Financiero */}
          <FinancialEstimatorBadge
            costUSD={packet?.financial.costUSD ?? 0}
            savingsUSD={packet?.financial.savingsUSD ?? 0}
            modelId={selectedModel}
          />
        </section>
      </main>

      {/* Pie de Página */}
      <footer className="w-full border-t border-white/5 py-4 px-6 text-center text-xs text-white/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Antigravity Liquid Token Lens • Gobernanza de Kevin</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400/80 font-mono text-[11px]">
          <Shield className="w-3 h-3" /> Zero-Leakage Policy: Procesamiento 100% On-Device
        </div>
      </footer>
    </div>
  );
};
