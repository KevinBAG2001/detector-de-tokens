import { describe, expect, it } from 'vitest';
import { parseQuotaExhaustionLogLine } from './parseQuotaLogLine.js';

const SAMPLE =
  '2026-09-17 19:12:39.555 [error] [LS Main stderr] ERROR: foo RESOURCE_EXHAUSTED (code 429): Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 167h3m27s.: RESOURCE_EXHAUSTED (code 429)';

describe('parseQuotaExhaustionLogLine', () => {
  it('parsea línea válida con Resets in y calcula resetAt', () => {
    const parsed = parseQuotaExhaustionLogLine(SAMPLE);
    expect(parsed).not.toBeNull();

    const detected = parsed!.detectedAt;
    expect(detected.getFullYear()).toBe(2026);
    expect(detected.getMonth()).toBe(8);
    expect(detected.getDate()).toBe(17);

    const expectedResetMs =
      detected.getTime() + (167 * 3600 + 3 * 60 + 27) * 1000;
    expect(parsed!.resetAt.getTime()).toBe(expectedResetMs);
    expect(parsed!.resetsInSeconds).toBe(167 * 3600 + 3 * 60 + 27);
  });

  it('acepta finales CRLF', () => {
    const parsed = parseQuotaExhaustionLogLine(`${SAMPLE}\r`);
    expect(parsed).not.toBeNull();
  });

  it('elige la línea más reciente entre varias en el mismo bloque', () => {
    const older =
      '2026-09-17 18:00:00.000 [error] RESOURCE_EXHAUSTED (code 429): Individual quota reached. Resets in 1h0m0s.';
    const newer =
      '2026-09-17 19:00:00.000 [error] RESOURCE_EXHAUSTED (code 429): Individual quota reached. Resets in 2h0m0s.';

    const a = parseQuotaExhaustionLogLine(older);
    const b = parseQuotaExhaustionLogLine(newer);
    expect(a!.detectedAt.getTime()).toBeLessThan(b!.detectedAt.getTime());
  });

  it('ignora líneas sin Resets in', () => {
    const line =
      '2026-09-17 19:12:39.555 [error] RESOURCE_EXHAUSTED (code 429): Individual quota reached. No timer.';
    expect(parseQuotaExhaustionLogLine(line)).toBeNull();
  });

  it('ignora líneas malformadas o sin 429', () => {
    expect(parseQuotaExhaustionLogLine('not a log line')).toBeNull();
    expect(
      parseQuotaExhaustionLogLine(
        '2026-09-17 19:12:39.555 [error] Individual quota reached. Resets in 1h0m0s.'
      )
    ).toBeNull();
  });
});
