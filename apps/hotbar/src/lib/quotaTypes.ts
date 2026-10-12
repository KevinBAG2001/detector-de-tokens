export type CuotaAntigravityEstado = 'agotado' | 'disponible' | 'desconocido';

export interface CuotaAntigravityIdeStatus {
  estado: CuotaAntigravityEstado;
  resetAt: string | null;
  sourceFile: string | null;
  detectedAt: string | null;
}

export const CUOTA_DESCONOCIDA: CuotaAntigravityIdeStatus = {
  estado: 'desconocido',
  resetAt: null,
  sourceFile: null,
  detectedAt: null,
};

export function normalizarCuotaSnapshot(
  quota: CuotaAntigravityIdeStatus | undefined | null
): CuotaAntigravityIdeStatus {
  if (!quota || typeof quota.estado !== 'string') {
    return CUOTA_DESCONOCIDA;
  }

  const estado = quota.estado;
  if (estado !== 'agotado' && estado !== 'disponible' && estado !== 'desconocido') {
    return CUOTA_DESCONOCIDA;
  }

  return {
    estado,
    resetAt: quota.resetAt ?? null,
    sourceFile: quota.sourceFile ?? null,
    detectedAt: quota.detectedAt ?? null,
  };
}
