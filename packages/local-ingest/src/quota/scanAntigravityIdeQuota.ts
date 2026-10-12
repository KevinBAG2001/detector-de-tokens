import fs from 'node:fs';
import path from 'node:path';
import {
  getAntigravityIdeLogsRoot,
  validarRutaIdeLogs,
} from '../seguridad/validarRutaIdeLogs.js';
import { parseQuotaExhaustionLogLine } from './parseQuotaLogLine.js';

export type CuotaAntigravityEstado = 'agotado' | 'disponible' | 'desconocido';

export interface CuotaAntigravityIdeStatus {
  estado: CuotaAntigravityEstado;
  resetAt: string | null;
  sourceFile: string | null;
  detectedAt: string | null;
}

export interface ScanIdeQuotaOptions {
  maxSessionFolders?: number;
  maxTailBytesPerFile?: number;
  now?: Date;
}

const SESSION_FOLDER = /^\d{8}T\d{6}$/;
const DEFAULT_MAX_FOLDERS = 8;
const DEFAULT_TAIL_BYTES = 512 * 1024;

function listSessionFolders(root: string, maxFolders: number): string[] {
  let entries: string[];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && SESSION_FOLDER.test(d.name))
      .map((d) => d.name);
  } catch {
    return [];
  }

  entries.sort((a, b) => b.localeCompare(a));
  return entries.slice(0, maxFolders);
}

function listLogFilesInSession(sessionDir: string): string[] {
  const candidates: string[] = ['ls-main.log'];

  try {
    const entries = fs.readdirSync(sessionDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }
      const name = entry.name.toLowerCase();
      if (name.startsWith('window') && name.endsWith('.log')) {
        candidates.push(entry.name);
      }
      if (name === 'renderer.log') {
        candidates.push(entry.name);
      }
    }
  } catch {
    // ls-main.log only
  }

  return [...new Set(candidates)];
}

function readTailLines(canonicalPath: string, maxBytes: number): string[] {
  const stat = fs.statSync(canonicalPath);
  if (stat.size === 0) {
    return [];
  }

  const readLen = Math.min(stat.size, maxBytes);
  const start = stat.size - readLen;
  const fd = fs.openSync(canonicalPath, 'r');

  try {
    const buffer = Buffer.alloc(readLen);
    fs.readSync(fd, buffer, 0, readLen, start);
    const text = buffer.toString('utf8');
    return text.split(/\r?\n/);
  } finally {
    fs.closeSync(fd);
  }
}

function findLatestQuotaHit(
  lines: string[]
): ReturnType<typeof parseQuotaExhaustionLogLine> | null {
  let latest: ReturnType<typeof parseQuotaExhaustionLogLine> = null;

  for (const line of lines) {
    const parsed = parseQuotaExhaustionLogLine(line);
    if (!parsed) {
      continue;
    }
    if (!latest || parsed.detectedAt.getTime() > latest.detectedAt.getTime()) {
      latest = parsed;
    }
  }

  return latest;
}

/**
 * Escanea carpetas de sesión de logs IDE (tail acotado) buscando el último 429 con "Resets in".
 */
export function scanAntigravityIdeQuotaStatus(
  options: ScanIdeQuotaOptions = {}
): CuotaAntigravityIdeStatus {
  const maxFolders = options.maxSessionFolders ?? DEFAULT_MAX_FOLDERS;
  const maxTailBytes = options.maxTailBytesPerFile ?? DEFAULT_TAIL_BYTES;
  const now = options.now ?? new Date();

  const root = getAntigravityIdeLogsRoot();
  if (!fs.existsSync(root)) {
    return {
      estado: 'desconocido',
      resetAt: null,
      sourceFile: null,
      detectedAt: null,
    };
  }

  let realRoot: string;
  try {
    realRoot = fs.realpathSync(root);
  } catch {
    return {
      estado: 'desconocido',
      resetAt: null,
      sourceFile: null,
      detectedAt: null,
    };
  }

  const sessionFolders = listSessionFolders(realRoot, maxFolders);
  if (sessionFolders.length === 0) {
    return {
      estado: 'desconocido',
      resetAt: null,
      sourceFile: null,
      detectedAt: null,
    };
  }

  let bestHit: {
    parsed: NonNullable<ReturnType<typeof parseQuotaExhaustionLogLine>>;
    sourceFile: string;
  } | null = null;

  let readAnyFile = false;

  for (const folder of sessionFolders) {
    const sessionPath = path.join(realRoot, folder);
    let sessionReal: string;
    try {
      sessionReal = fs.realpathSync(sessionPath);
    } catch {
      continue;
    }

    const normRoot = realRoot.toLowerCase().replace(/\\/g, '/');
    const normSession = sessionReal.toLowerCase().replace(/\\/g, '/');
    if (normSession !== normRoot && !normSession.startsWith(`${normRoot}/`)) {
      continue;
    }

    for (const logName of listLogFilesInSession(sessionReal)) {
      const relative = path.join(folder, logName);
      let canonical: string;
      try {
        canonical = validarRutaIdeLogs(relative);
      } catch {
        continue;
      }

      let lines: string[];
      try {
        lines = readTailLines(canonical, maxTailBytes);
        readAnyFile = true;
      } catch {
        continue;
      }

      const hit = findLatestQuotaHit(lines);
      if (!hit) {
        continue;
      }

      if (
        !bestHit ||
        hit.detectedAt.getTime() > bestHit.parsed.detectedAt.getTime()
      ) {
        bestHit = { parsed: hit, sourceFile: canonical };
      }
    }
  }

  if (!readAnyFile) {
    return {
      estado: 'desconocido',
      resetAt: null,
      sourceFile: null,
      detectedAt: null,
    };
  }

  if (!bestHit) {
    return {
      estado: 'disponible',
      resetAt: null,
      sourceFile: null,
      detectedAt: null,
    };
  }

  const { parsed, sourceFile } = bestHit;
  const resetAtIso = parsed.resetAt.toISOString();
  const detectedAtIso = parsed.detectedAt.toISOString();
  const agotado = parsed.resetAt.getTime() > now.getTime();

  return {
    estado: agotado ? 'agotado' : 'disponible',
    resetAt: resetAtIso,
    sourceFile,
    detectedAt: detectedAtIso,
  };
}
