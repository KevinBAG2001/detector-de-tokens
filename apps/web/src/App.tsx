import React, { useEffect, useState } from 'react';
import { useTokenStream } from '@/application/hooks/useTokenStream';
import { tokenApi } from '@/infrastructure/HttpTokenApi';
import { HeaderStatusBar } from '@/components/features/HeaderStatusBar';
import { TokenLiquidCard } from '@/components/features/TokenLiquidCard';
import { GranularBreakdownPanel } from '@/components/features/GranularBreakdownPanel';
import { RateLimitMeter } from '@/components/features/RateLimitMeter';
import { FinancialEstimatorBadge } from '@/components/features/FinancialEstimatorBadge';
import { FloatingPillDock } from '@/components/features/FloatingPillDock';
import { LiveStreamTerminal } from '@/components/features/LiveStreamTerminal';
import { TauriTrayDock } from '@/components/features/TauriTrayDock';
import { AlertTriangle, Sparkles, Terminal, Shield, Eye, EyeOff } from 'lucide-react';

export const App: React.FC = () => {
  const { packet, status, latencyMs, error, switchSession, setModel } = useTokenStream();
  const [sessions, setSessions] = useState<Array<{ sessionId: string; lastModified: string; sizeBytes: number }>>([]);
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-pro' | 'gemini-2.5-flash'>('gemini-2.5-pro');

  // Estados interactivos traídos del diseño de Stitch
  const [simulationState, setSimulationState] = useState<'optimal' | 'warning' | 'critical' | null>(null);
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [simulatedTokensAdded, setSimulatedTokensAdded] = useState(0);

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

  // Métricas reales combinadas con posibles simulaciones de prueba
  const maxTokens = packet?.model.contextWindowLimit ?? (selectedModel === 'gemini-2.5-pro' ? 2_000_000 : 1_000_000);
  const baseTokensPrompt = (packet?.tokens.prompt ?? 42_850) + simulatedTokensAdded;
  const baseTokensOutput = packet?.tokens.output ?? 18_420;
  const baseTokensCached = packet?.tokens.cached ?? 35_622;
  const baseTokensThinking = packet?.tokens.thinking ?? 34_180;
  const totalAccumulated = baseTokensPrompt + baseTokensOutput + baseTokensCached + baseTokensThinking;

  let computedFillPercentage = packet?.gauge.fillPercentage ?? Math.min(100, Math.round((totalAccumulated / maxTokens) * 1000) / 10);
  let computedSeverity: 'safe' | 'warning' | 'critical' = packet?.gauge.severity ?? 'safe';

  if (simulationState === 'optimal') {
    computedFillPercentage = 45.2;
    computedSeverity = 'safe';
  } else if (simulationState === 'warning') {
    computedFillPercentage = 76.8;
    computedSeverity = 'warning';
  } else if (simulationState === 'critical') {
    computedFillPercentage = 94.6;
    computedSeverity = 'critical';
  }

  const modelDisplayName = selectedModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro (Antigravity)' : 'Gemini 2.5 Flash (Antigravity)';
  const costUSD = packet?.financial.costUSD ?? (totalAccumulated * 0.0000025);
  const savingsUSD = packet?.financial.savingsUSD ?? 6.48;

  const handleFlushCache = () => {
    setSimulatedTokensAdded(0);
    setSimulationState(null);
  };

  const handleSimulateBurst = (amount: number) => {
    setSimulatedTokensAdded((prev) => prev + amount);
    setSimulationState('warning');
  };

  const handleSimulateThinking = () => {
    setSimulatedTokensAdded((prev) => prev + 50_000);
    setSimulationState('critical');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative overflow-x-hidden">
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
            <span>Motor de streaming desconectado. Visualizando telemetría local / reactiva.</span>
          </div>
          <span className="font-mono text-[10px] text-white/50">ws://localhost:3001/ws</span>
        </div>
      )}

      {/* Barra compacta superior Hotbar Capsule (Diseño Stitch) */}
      <FloatingPillDock
        modelName={selectedModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}
        fillPercentage={computedFillPercentage}
        costUSD={costUSD}
        isStreamPaused={isStreamPaused}
        severity={computedSeverity}
        onFlushCache={handleFlushCache}
        onTogglePause={() => setIsStreamPaused(!isStreamPaused)}
      />

      {/* Controles de Simulación de Presión y Estado (Stitch HUD Controls) */}
      <div className="max-w-7xl w-full mx-auto px-6 pt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
            HUD v4.8-HYDRA •
          </span>
          <span className="text-xs text-cyan-300 font-mono font-semibold">
            {packet?.sessionId ?? 'LIVE SESSION #LLM-LOCAL'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-xl">
          <span className="text-[10px] font-mono text-slate-400 px-2 uppercase hidden sm:inline">
            Presión:
          </span>
          <button
            onClick={() => setSimulationState('optimal')}
            className={`px-3 py-1 rounded-full text-[10px] font-mono transition-all ${
              simulationState === 'optimal'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            &lt;70% Óptimo
          </button>
          <button
            onClick={() => setSimulationState('warning')}
            className={`px-3 py-1 rounded-full text-[10px] font-mono transition-all ${
              simulationState === 'warning'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            70-85% Alerta
          </button>
          <button
            onClick={() => setSimulationState('critical')}
            className={`px-3 py-1 rounded-full text-[10px] font-mono transition-all ${
              simulationState === 'critical'
                ? 'bg-red-500 text-white font-bold shadow-md shadow-red-500/30'
                : 'text-slate-400 hover:text-red-300'
            }`}
          >
            &gt;85% Crítico
          </button>
          {simulationState && (
            <button
              onClick={() => setSimulationState(null)}
              className="text-[10px] font-mono text-slate-400 hover:text-slate-200 px-2 underline"
              title="Restaurar a datos reales de streaming"
            >
              Reset
            </button>
          )}
          <div className="w-[1px] h-3.5 bg-white/10 mx-1" />
          <button
            onClick={() => setIsHudVisible(!isHudVisible)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-200"
            title="Alternar visibilidad del HUD"
          >
            {isHudVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Contenedor Principal: Bento Grid */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto px-6 py-6 transition-all duration-300 ${
          isHudVisible ? 'opacity-100 scale-100' : 'opacity-15 scale-[0.98]'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda (7 cols): Hero Kinetic Cylinder + Live Stream Terminal */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            <TokenLiquidCard
              promptTokens={baseTokensPrompt}
              outputTokens={baseTokensOutput}
              cachedTokens={baseTokensCached}
              thinkingTokens={baseTokensThinking}
              maxTokens={maxTokens}
              modelName={modelDisplayName}
              costUSD={costUSD}
              savingsUSD={savingsUSD}
              tpmRemaining={packet?.rateLimits.tpmRemaining ?? 3_820_000}
              tpmLimit={packet?.rateLimits.tpmLimit ?? 4_000_000}
              rpmRemaining={packet?.rateLimits.rpmRemaining ?? 340}
              rpmLimit={packet?.rateLimits.rpmLimit ?? 360}
              severity={computedSeverity}
              fillPercentage={computedFillPercentage}
              variant="kinetic"
            />

            {/* Consola de telemetría de inferencia y simulación de ráfagas */}
            <LiveStreamTerminal
              modelName={modelDisplayName}
              latencyMs={latencyMs}
              totalTokens={totalAccumulated}
              onSimulateBurst={handleSimulateBurst}
              onSimulateThinking={handleSimulateThinking}
            />
          </section>

          {/* Columna Derecha (5 cols): Desglose Granular, Límites de Cuota y Estimador Financiero */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            {/* Desglose Granular */}
            <GranularBreakdownPanel
              prompt={baseTokensPrompt}
              output={baseTokensOutput}
              cached={baseTokensCached}
              thinking={baseTokensThinking}
              total={totalAccumulated}
              maxTokens={maxTokens}
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
              costUSD={costUSD}
              savingsUSD={savingsUSD}
              modelId={selectedModel}
            />
          </section>
        </div>
      </main>

      {/* Dock Flotante Tauri Tray (Esquina inferior derecha, estilo app de bandeja nativa) */}
      <TauriTrayDock
        fillPercentage={computedFillPercentage}
        totalTokens={totalAccumulated}
        maxTokens={maxTokens}
        costUSD={costUSD}
        modelName={selectedModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}
        sessionId={packet?.sessionId}
        severity={computedSeverity}
        onFlushCache={handleFlushCache}
      />

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
