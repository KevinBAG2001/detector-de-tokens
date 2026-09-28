import { useCallback, useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { fetchAntigravitySnapshot, type AntigravityTokenSnapshot } from './adapters/antigravityAdapter';
import { getCursorTokenSnapshot } from './adapters/cursorAdapter';
import { getDockerPanelState } from './adapters/dockerAdapter';
import { getProcessesPanelState } from './adapters/processesAdapter';
import './App.css';

const REFRESH_MS = 15_000;

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value);
}

export default function App() {
  const [snapshot, setSnapshot] = useState<AntigravityTokenSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const unlisten = listen('hotbar:refresh', () => {
      void refresh();
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [refresh]);

  const tokens = snapshot?.tokens;

  return (
    <main className="hotbar-shell">
      <header className="hotbar-header">
        <div>
          <p className="hotbar-kicker">Detector de tokens</p>
          <h1>Antigravity Hotbar</h1>
        </div>
        <button type="button" className="hotbar-refresh" onClick={() => void refresh()} disabled={loading}>
          {loading ? '…' : '↻'}
        </button>
      </header>

      <section className="hotbar-card hotbar-card--primary" aria-live="polite">
        <h2>Google Antigravity</h2>
        {error && <p className="hotbar-muted hotbar-error">{error}</p>}
        {!error && snapshot && !snapshot.available && (
          <p className="hotbar-muted">{snapshot.message ?? 'Sin datos locales'}</p>
        )}
        {tokens && snapshot?.available && (
          <>
            <p className="hotbar-session">Sesión: {snapshot.sessionId ?? '—'}</p>
            <p className="hotbar-total">{formatNumber(tokens.totalAccumulated)} tokens</p>
            <dl className="hotbar-grid">
              <div>
                <dt>Prompt</dt>
                <dd>{formatNumber(tokens.prompt)}</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>{formatNumber(tokens.output)}</dd>
              </div>
              <div>
                <dt>Cached</dt>
                <dd>{formatNumber(tokens.cached)}</dd>
              </div>
              <div>
                <dt>Thinking</dt>
                <dd>{formatNumber(tokens.thinking)}</dd>
              </div>
            </dl>
          </>
        )}
      </section>

      <section className="hotbar-card hotbar-card--disabled">
        <h2>Cursor</h2>
        <p className="hotbar-muted">{cursorStub.reason}</p>
      </section>

      <section className="hotbar-card hotbar-card--stub">
        <h2>Procesos dev</h2>
        <p className="hotbar-muted">{processesStub.note}</p>
      </section>

      <section className="hotbar-card hotbar-card--stub">
        <h2>Docker</h2>
        <p className="hotbar-muted">{dockerStub.note}</p>
      </section>

      <footer className="hotbar-footer">
        <span>Bandeja del sistema · clic para mostrar/ocultar</span>
      </footer>
    </main>
  );
}
