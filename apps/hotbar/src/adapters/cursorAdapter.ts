export interface CursorTokenSnapshot {
  source: 'cursor';
  available: false;
  reason: string;
}

/**
 * Adaptador Cursor — deshabilitado en v1 hasta existir fuente local/API legítima.
 */
export function getCursorTokenSnapshot(): CursorTokenSnapshot {
  return {
    source: 'cursor',
    available: false,
    reason: 'No disponible: sin fuente local verificada (stub v1).',
  };
}
