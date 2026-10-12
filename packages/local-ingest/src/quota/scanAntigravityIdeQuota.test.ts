import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scanAntigravityIdeQuotaStatus } from './scanAntigravityIdeQuota.js';

describe('scanAntigravityIdeQuotaStatus', () => {
  let tmpDir: string;
  let previousEnv: string | undefined;

  beforeEach(() => {
    previousEnv = process.env.ANTIGRAVITY_IDE_LOGS_ROOT;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ide-quota-logs-'));
    process.env.ANTIGRAVITY_IDE_LOGS_ROOT = tmpDir;
  });

  afterEach(() => {
    if (previousEnv === undefined) {
      delete process.env.ANTIGRAVITY_IDE_LOGS_ROOT;
    } else {
      process.env.ANTIGRAVITY_IDE_LOGS_ROOT = previousEnv;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeSessionLog(
    sessionId: string,
    fileName: string,
    content: string
  ): string {
    const dir = path.join(tmpDir, sessionId);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }

  it('devuelve desconocido si no hay raíz legible', () => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    const status = scanAntigravityIdeQuotaStatus();
    expect(status.estado).toBe('desconocido');
  });

  it('devuelve disponible sin 429 en logs legibles', () => {
    writeSessionLog('20260917T191200', 'ls-main.log', '2026-09-17 19:00:00.000 [info] ok\n');
    const status = scanAntigravityIdeQuotaStatus();
    expect(status.estado).toBe('disponible');
    expect(status.resetAt).toBeNull();
  });

  it('marca agotado cuando resetAt está en el futuro', () => {
    const filePath = writeSessionLog(
      '20260917T191200',
      'ls-main.log',
      '2026-09-17 19:12:39.555 [error] RESOURCE_EXHAUSTED (code 429): Individual quota reached. Resets in 48h0m0s.\r\n'
    );

    const now = new Date('2026-09-18T12:00:00.000Z');
    const status = scanAntigravityIdeQuotaStatus({ now });
    expect(status.estado).toBe('agotado');
    expect(status.sourceFile).toBe(fs.realpathSync(filePath));
    expect(status.detectedAt).not.toBeNull();
    expect(status.resetAt).not.toBeNull();
  });

  it('marca disponible cuando el reseteo ya pasó', () => {
    writeSessionLog(
      '20260917T191200',
      'ls-main.log',
      '2026-09-17 19:12:39.555 [error] RESOURCE_EXHAUSTED (code 429): Individual quota reached. Resets in 1h0m0s.\n'
    );

    const now = new Date('2026-09-20T00:00:00.000Z');
    const status = scanAntigravityIdeQuotaStatus({ now });
    expect(status.estado).toBe('disponible');
    expect(status.resetAt).not.toBeNull();
  });

  it('prefiere el 429 más reciente entre carpetas de sesión', () => {
    writeSessionLog(
      '20260916T100000',
      'ls-main.log',
      '2026-09-16 10:00:00.000 [error] RESOURCE_EXHAUSTED (code 429): Individual quota reached. Resets in 100h0m0s.\n'
    );
    writeSessionLog(
      '20260917T191200',
      'ls-main.log',
      '2026-09-17 19:12:39.555 [error] RESOURCE_EXHAUSTED (code 429): Individual quota reached. Resets in 48h0m0s.\n'
    );

    const now = new Date('2026-09-18T12:00:00.000Z');
    const status = scanAntigravityIdeQuotaStatus({ now });
    expect(status.estado).toBe('agotado');
    expect(status.detectedAt).toContain('2026-09-17');
  });
});
