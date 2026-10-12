import type { CuotaAntigravityIdeStatus } from './quotaTypes';

export function formatQuotaCountdown(resetAtIso: string, nowMs: number): string {
  const resetMs = new Date(resetAtIso).getTime();
  const diffMs = Math.max(0, resetMs - nowMs);

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days} d`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours} h`);
  }
  parts.push(`${minutes} min`);

  return parts.join(' ');
}

export function formatResetDate(resetAtIso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(resetAtIso));
}

export function quotaEstadoLabel(estado: CuotaAntigravityIdeStatus['estado']): string {
  switch (estado) {
    case 'agotado':
      return 'Cuota individual agotada';
    case 'disponible':
      return 'Sin bloqueo activo';
    case 'desconocido':
      return 'Estado de cuota desconocido';
  }
}

export function quotaDetailMessage(
  quota: CuotaAntigravityIdeStatus,
  nowMs: number
): string {
  if (quota.estado === 'desconocido') {
    return 'No se pudieron leer logs del IDE Antigravity en esta máquina.';
  }

  if (quota.estado === 'agotado' && quota.resetAt) {
    return `Se restablece en ${formatQuotaCountdown(quota.resetAt, nowMs)} (${formatResetDate(quota.resetAt)})`;
  }

  if (quota.estado === 'disponible' && !quota.resetAt) {
    return 'Sin límite alcanzado registrado';
  }

  if (quota.estado === 'disponible' && quota.resetAt) {
    return 'El último bloqueo por cuota ya expiró según los logs del IDE.';
  }

  return 'Sin límite alcanzado registrado';
}
