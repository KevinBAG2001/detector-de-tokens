import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import chokidar from 'chokidar';
import { GranularTokenCount } from '@antigravity/domain-core';
import { getAntigravityLogsRoot, validarRutaLogs, validarSessionId } from '../seguridad/validarRutaLogs.js';

export interface SessionInfo {
  sessionId: string;
  lastModified: Date;
  sizeBytes: number;
}

export type TokenDeltaCallback = (delta: GranularTokenCount, totalAccumulatedSoFar: GranularTokenCount) => void;

/**
 * Adaptador de Observación e Ingesta de Transcripciones Locales de Antigravity.
 * Cumple estrictamente con la política Zero-Leakage: jamás extrae ni emite texto de prompts ni código.
 */
export class AntigravityTranscriptWatcherAdapter {
  private currentWatcher: chokidar.FSWatcher | null = null;
  private currentWatchedPath: string | null = null;
  private currentSessionId: string | null = null;
  private lastProcessedLine = 0;
  private accumulatedTokens: GranularTokenCount = GranularTokenCount.empty();
  private onDeltaCallback: TokenDeltaCallback | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  /**
   * Lista todas las sesiones disponibles dentro del directorio de Antigravity.
   */
  public listAvailableSessions(): SessionInfo[] {
    const logsRoot = getAntigravityLogsRoot();
    if (!fs.existsSync(logsRoot)) {
      return [];
    }

    const entries = fs.readdirSync(logsRoot, { withFileTypes: true });
    const sessions: SessionInfo[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const sessionId = entry.name;
      const transcriptPath = path.join(logsRoot, sessionId, '.system_generated', 'logs', 'transcript.jsonl');

      if (fs.existsSync(transcriptPath)) {
        try {
          const stats = fs.statSync(transcriptPath);
          sessions.push({
            sessionId,
            lastModified: stats.mtime,
            sizeBytes: stats.size,
          });
        } catch {
          // Omitir si el archivo está bloqueado temporalmente
        }
      }
    }

    return sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  /**
   * Obtiene la sesión más reciente activa.
   */
  public getLatestSession(): SessionInfo | null {
    const sessions = this.listAvailableSessions();
    return sessions.length > 0 ? sessions[0] : null;
  }

  /**
   * Lee el transcript completo de una sesión y devuelve totales acumulados (sin observación reactiva).
   */
  public async readSessionTotals(sessionId: string): Promise<GranularTokenCount> {
    const validSession = validarSessionId(sessionId);
    const logsRoot = getAntigravityLogsRoot();
    const candidatePath = path.join(logsRoot, validSession, '.system_generated', 'logs', 'transcript.jsonl');
    const safeTranscriptPath = validarRutaLogs(candidatePath);
    return readTranscriptFileTotals(safeTranscriptPath);
  }

  /**
   * Snapshot de la sesión más reciente (o vacío si no hay logs).
   */
  public async readLatestSessionSnapshot(): Promise<{
    sessionId: string | null;
    tokens: GranularTokenCount;
  }> {
    const latest = this.getLatestSession();
    if (!latest) {
      return { sessionId: null, tokens: GranularTokenCount.empty() };
    }
    const tokens = await this.readSessionTotals(latest.sessionId);
    return { sessionId: latest.sessionId, tokens };
  }

  /**
   * Inicia la observación reactiva de una sesión específica de Antigravity.
   */
  public async watchSession(sessionId: string, onDelta: TokenDeltaCallback): Promise<GranularTokenCount> {
    const validSession = validarSessionId(sessionId);
    const logsRoot = getAntigravityLogsRoot();
    const candidatePath = path.join(logsRoot, validSession, '.system_generated', 'logs', 'transcript.jsonl');
    const safeTranscriptPath = validarRutaLogs(candidatePath);

    this.stopWatching();

    this.currentSessionId = validSession;
    this.currentWatchedPath = safeTranscriptPath;
    this.onDeltaCallback = onDelta;
    this.lastProcessedLine = 0;
    this.accumulatedTokens = GranularTokenCount.empty();

    await this.processIncrementalChanges();

    this.currentWatcher = chokidar.watch(safeTranscriptPath, {
      persistent: true,
      usePolling: false,
      interval: 50,
      awaitWriteFinish: {
        stabilityThreshold: 35,
        pollInterval: 10,
      },
    });

    this.currentWatcher.on('change', () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        void this.processIncrementalChanges();
      }, 35);
    });

    return this.accumulatedTokens;
  }

  private async processIncrementalChanges(): Promise<void> {
    if (!this.currentWatchedPath || !fs.existsSync(this.currentWatchedPath)) {
      return;
    }

    const fileStream = fs.createReadStream(this.currentWatchedPath, { encoding: 'utf-8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let currentLineIndex = 0;
    let batchDelta = GranularTokenCount.empty();

    for await (const line of rl) {
      currentLineIndex++;
      if (currentLineIndex <= this.lastProcessedLine) {
        continue;
      }

      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const tokensFromLine = parseLineTokens(trimmedLine);
      if (tokensFromLine.totalAccumulated > 0) {
        batchDelta = batchDelta.add(tokensFromLine);
      }
    }

    this.lastProcessedLine = currentLineIndex;

    if (batchDelta.totalAccumulated > 0) {
      this.accumulatedTokens = this.accumulatedTokens.add(batchDelta);
      if (this.onDeltaCallback) {
        this.onDeltaCallback(batchDelta, this.accumulatedTokens);
      }
    }
  }

  public stopWatching(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.currentWatcher) {
      void this.currentWatcher.close();
      this.currentWatcher = null;
    }
    this.currentWatchedPath = null;
    this.currentSessionId = null;
    this.lastProcessedLine = 0;
  }

  public get currentSession(): string | null {
    return this.currentSessionId;
  }

  public get currentAccumulated(): GranularTokenCount {
    return this.accumulatedTokens;
  }
}

export async function readTranscriptFileTotals(transcriptPath: string): Promise<GranularTokenCount> {
  if (!fs.existsSync(transcriptPath)) {
    return GranularTokenCount.empty();
  }

  const fileStream = fs.createReadStream(transcriptPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let accumulated = GranularTokenCount.empty();

  for await (const line of rl) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    const tokensFromLine = parseLineTokens(trimmedLine);
    if (tokensFromLine.totalAccumulated > 0) {
      accumulated = accumulated.add(tokensFromLine);
    }
  }

  return accumulated;
}

/**
 * Parser seguro de tokens a partir de una línea JSONL de Antigravity.
 * Política Zero-Leakage: Desecha contenido textual y extrae exclusivamente telemetría cuantitativa.
 */
export function parseLineTokens(line: string): GranularTokenCount {
  try {
    const data = JSON.parse(line);

    if (data.usageMetadata && typeof data.usageMetadata === 'object') {
      const prompt = Number(data.usageMetadata.promptTokenCount) || 0;
      const candidates = Number(data.usageMetadata.candidatesTokenCount) || 0;
      const cached = Number(data.usageMetadata.cachedContentTokenCount) || 0;
      const thinking = Number(data.usageMetadata.thinkingTokenCount) || 0;
      return new GranularTokenCount(prompt, candidates, cached, thinking);
    }

    let promptTokens = 0;
    let outputTokens = 0;
    let cachedTokens = 0;
    let thinkingTokens = 0;

    const source = data.source;
    const type = data.type;

    const estimateFromText = (text: unknown): number => {
      if (!text || typeof text !== 'string') return 0;
      return Math.max(1, Math.ceil(text.length / 4));
    };

    if (source === 'USER_EXPLICIT' || source === 'SYSTEM') {
      promptTokens += estimateFromText(data.content);
    } else if (source === 'MODEL') {
      if (type === 'PLANNER_RESPONSE') {
        if (data.thinking) {
          thinkingTokens += estimateFromText(data.thinking);
        }
        if (data.content) {
          outputTokens += estimateFromText(data.content);
        }
        if (Array.isArray(data.tool_calls) && data.tool_calls.length > 0) {
          outputTokens += estimateFromText(JSON.stringify(data.tool_calls));
        }
      }
    }

    return new GranularTokenCount(promptTokens, outputTokens, cachedTokens, thinkingTokens);
  } catch {
    return GranularTokenCount.empty();
  }
}
