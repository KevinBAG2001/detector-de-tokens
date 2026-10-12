export type CuotaAntigravityEstado = 'agotado' | 'disponible' | 'desconocido';

export interface CuotaAntigravityIdeStatus {
  estado: CuotaAntigravityEstado;
  resetAt: string | null;
  sourceFile: string | null;
  detectedAt: string | null;
}
