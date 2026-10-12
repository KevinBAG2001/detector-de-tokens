import { describe, expect, it } from 'vitest';
import { CUOTA_DESCONOCIDA, normalizarCuotaSnapshot } from './quotaTypes';

describe('normalizarCuotaSnapshot', () => {
  it('devuelve desconocido si quota es undefined', () => {
    expect(normalizarCuotaSnapshot(undefined)).toEqual(CUOTA_DESCONOCIDA);
  });

  it('conserva quota válida', () => {
    expect(
      normalizarCuotaSnapshot({
        estado: 'agotado',
        resetAt: '2026-01-01T00:00:00.000Z',
        sourceFile: '/tmp/log',
        detectedAt: null,
      }).estado
    ).toBe('agotado');
  });

  it('devuelve desconocido si estado no es reconocido', () => {
    expect(
      normalizarCuotaSnapshot({
        estado: 'invalido' as 'agotado',
        resetAt: null,
        sourceFile: null,
        detectedAt: null,
      })
    ).toEqual(CUOTA_DESCONOCIDA);
  });
});
