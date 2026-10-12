import { useCallback, useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import {
  HotbarPillDock,
  KineticLiquidChamber,
  QuotaLiquidPanel,
  StubModuleCard,
  TokenGranularBreakdown,
} from '@antigravity/ui-liquid';
import { fetchAntigravitySnapshot, type AntigravityTokenSnapshot } from './adapters/antigravityAdapter';
import { getCursorTokenSnapshot } from './adapters/cursorAdapter';
import { getDockerPanelState } from './adapters/dockerAdapter';
import { getProcessesPanelState } from './adapters/processesAdapter';
import { quotaDetailMessage, quotaEstadoLabel } from './lib/quotaDisplay';
import { normalizarCuotaSnapshot } from './lib/quotaTypes';

const REFRESH_MS = 15_000;

export default function App() {
  const [snapshot, setSnapshot] = useState<AntigravityTokenSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const cursorStub = getCursorTokenSnapshot();
  const processesStub = getProcessesPanelState();
  const dockerStub = getDockerPanelState();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAntigravitySnapshot();
      setSnapshot(data);
      if (!data.available && data.message) {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const tick = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const unlisten = listen('hotbar:refresh', () => {
      void refresh();
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [refresh]);

  const tokens = snapshot?.available ? snapshot.tokens : null;
  const quota = normalizarCuotaSnapshot(snapshot?.quota);
  const quotaDetail = quotaDetailMessage(quota, nowMs);

  const sessionLabel =
    snapshot?.sessionId?.slice(0, 18) ?? (snapshot?.available ? 'Sesión activa' : 'Sin sesión local');

  const totalTokens = tokens?.totalAccumulated ?? (snapshot?.available ? 0 : null);

  return (
    <main className="min-h-full w-full max-w-[420px] mx-auto px-2 py-2 flex flex-col gap-2 text-slate-100 select-none">
      <HotbarPillDock
        sessionLabel={sessionLabel}
        totalTokens={totalTokens}
        quotaTone={quota.estado}
        loading={loading}
        onRefresh={() => void refresh()}
      />

      {error && (
        <p className="text-[11px] text-amber-200/90 px-1" role="alert">
          {error}
        </p>
      )}

      <KineticLiquidChamber
        compact
        totalTokens={totalTokens}
        prompt={tokens?.prompt ?? 0}
        output={tokens?.output ?? 0}
        cached={tokens?.cached ?? 0}
        thinking={tokens?.thinking ?? 0}
      />

      <TokenGranularBreakdown
        compact
        prompt={tokens?.prompt ?? null}
        output={tokens?.output ?? null}
        cached={tokens?.cached ?? null}
        thinking={tokens?.thinking ?? null}
        total={totalTokens}
      />

      <QuotaLiquidPanel
        compact
        estado={quota.estado}
        estadoLabel={quotaEstadoLabel(quota.estado)}
        detail={quotaDetail}
      />

      <StubModuleCard title="Cursor" body={cursorStub.reason} variant="disabled" />
      <StubModuleCard title="Procesos dev" body={processesStub.note} />
      <StubModuleCard title="Docker" body={dockerStub.note} />

      <footer className="text-[9px] text-center text-slate-600 pb-1" data-tauri-drag-region>
        Bandeja del sistema · clic para mostrar/ocultar
      </footer>
    </main>
  );
}
