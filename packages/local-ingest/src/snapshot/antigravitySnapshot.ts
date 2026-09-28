import { GranularTokenCount } from '@antigravity/domain-core';
import { getAntigravityLogsRoot } from '../seguridad/validarRutaLogs.js';
import { AntigravityTranscriptWatcherAdapter } from '../watcher/AntigravityTranscriptWatcherAdapter.js';

export interface AntigravityTokenSnapshot {
  source: 'antigravity';
  available: boolean;
  sessionId: string | null;
  tokens: {
    prompt: number;
    output: number;
    cached: number;
    thinking: number;
    totalAccumulated: number;
  };
  message: string | null;
}

function serializeTokens(tokens: GranularTokenCount): AntigravityTokenSnapshot['tokens'] {
  return {
    prompt: tokens.prompt,
    output: tokens.output,
    cached: tokens.cached,
    thinking: tokens.thinking,
    totalAccumulated: tokens.totalAccumulated,
  };
}

/**
 * Lectura puntual de métricas Antigravity desde logs locales (sin servidor HTTP).
 */
export async function getAntigravityTokenSnapshot(): Promise<AntigravityTokenSnapshot> {
  const logsRoot = getAntigravityLogsRoot();
  const watcher = new AntigravityTranscriptWatcherAdapter();

  try {
    const latest = watcher.getLatestSession();
    if (!latest) {
      return {
        source: 'antigravity',
        available: false,
        sessionId: null,
        tokens: serializeTokens(GranularTokenCount.empty()),
        message: `No hay sesiones con transcript en ${logsRoot}`,
      };
    }

    const { sessionId, tokens } = await watcher.readLatestSessionSnapshot();
    return {
      source: 'antigravity',
      available: true,
      sessionId,
      tokens: serializeTokens(tokens),
      message: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al leer logs';
    return {
      source: 'antigravity',
      available: false,
      sessionId: null,
      tokens: serializeTokens(GranularTokenCount.empty()),
      message,
    };
  }
}
