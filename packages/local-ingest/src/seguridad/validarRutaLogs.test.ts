import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ErrorValidacionRuta } from './ErrorValidacionRuta.js';
import { validarRutaLogs } from './validarRutaLogs.js';

describe('validarRutaLogs — frontera de path', () => {
  let tmpDir: string;
  let logsRoot: string;
  let previousEnv: string | undefined;

  beforeEach(() => {
    previousEnv = process.env.ANTIGRAVITY_LOGS_ROOT;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validar-ruta-logs-'));
    logsRoot = path.join(tmpDir, 'brain');
    fs.mkdirSync(logsRoot, { recursive: true });
    process.env.ANTIGRAVITY_LOGS_ROOT = logsRoot;
  });

  afterEach(() => {
    if (previousEnv === undefined) {
      delete process.env.ANTIGRAVITY_LOGS_ROOT;
    } else {
      process.env.ANTIGRAVITY_LOGS_ROOT = previousEnv;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function crearTranscriptBajo(root: string, sessionId: string): string {
    const transcriptPath = path.join(
      root,
      sessionId,
      '.system_generated',
      'logs',
      'transcript.jsonl'
    );
    fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
    fs.writeFileSync(transcriptPath, '{"usageMetadata":{"promptTokenCount":1}}\n');
    return transcriptPath;
  }

  it('acepta un path legítimo bajo la raíz', () => {
    const legitPath = crearTranscriptBajo(logsRoot, 'session-legitima');
    const canonical = validarRutaLogs(legitPath);
    expect(canonical).toBe(fs.realpathSync(legitPath));
  });

  it('rechaza un path canónico hermano (prefijo brain vs brain-evil)', () => {
    crearTranscriptBajo(logsRoot, 'session-en-raiz');
    const brainEvil = path.join(tmpDir, 'brain-evil');
    const evilPath = crearTranscriptBajo(brainEvil, 'session-maliciosa');

    expect(() => validarRutaLogs(evilPath)).toThrow(ErrorValidacionRuta);
    try {
      validarRutaLogs(evilPath);
    } catch (err) {
      expect(err).toBeInstanceOf(ErrorValidacionRuta);
      expect((err as ErrorValidacionRuta).mensajeCliente).toBe('Ruta no permitida.');
      expect((err as Error).message).not.toContain(logsRoot);
      expect((err as Error).message).not.toContain('brain-evil');
    }
  });

  it('rechaza un symlink cuyo destino canónico queda fuera de la raíz', () => {
    const brainEvil = path.join(tmpDir, 'brain-evil');
    const evilPath = crearTranscriptBajo(brainEvil, 'session-externa');

    const linkSessionDir = path.join(logsRoot, 'session-symlink', '.system_generated', 'logs');
    fs.mkdirSync(linkSessionDir, { recursive: true });
    const linkPath = path.join(linkSessionDir, 'transcript.jsonl');

    try {
      fs.symlinkSync(evilPath, linkPath);
    } catch {
      return;
    }

    expect(() => validarRutaLogs(linkPath)).toThrow(ErrorValidacionRuta);
    try {
      validarRutaLogs(linkPath);
    } catch (err) {
      expect((err as ErrorValidacionRuta).mensajeCliente).toBe('Ruta no permitida.');
    }
  });
});
