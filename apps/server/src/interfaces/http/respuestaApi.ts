import type { Response } from 'express';

export interface EnvelopeApi<T = any> {
  exito: boolean;
  mensaje: string;
  datos: T;
  meta?: Record<string, any>;
}

export function enviarRespuestaExitosa<T>(
  res: Response,
  mensaje: string,
  datos: T,
  meta?: Record<string, any>,
  statusCode = 200
): void {
  const respuesta: EnvelopeApi<T> = {
    exito: true,
    mensaje,
    datos,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  res.status(statusCode).json(respuesta);
}

export function enviarRespuestaError(
  res: Response,
  mensaje: string,
  statusCode = 400,
  detalles?: any
): void {
  const respuesta: EnvelopeApi<null> = {
    exito: false,
    mensaje,
    datos: null,
    meta: {
      timestamp: new Date().toISOString(),
      ...(detalles ? { detalles } : {}),
    },
  };
  res.status(statusCode).json(respuesta);
}
