import type { Request, Response } from 'express';
import { StreamTokensUseCase } from '../../../application/use-cases/StreamTokensUseCase.js';
import { AntigravityTranscriptWatcherAdapter } from '../../../infrastructure/watcher/AntigravityTranscriptWatcherAdapter.js';
import { GeminiApiClientAdapter } from '../../../infrastructure/gemini/GeminiApiClientAdapter.js';
import { InMemoryMetricLogAdapter } from '../../../infrastructure/logging/InMemoryMetricLogAdapter.js';
import { ErrorValidacionRuta } from '../../../infrastructure/seguridad/ErrorValidacionRuta.js';
import { enviarRespuestaExitosa, enviarRespuestaError } from '../respuestaApi.js';

function esErrorValidacionSesion(err: Error): boolean {
  const msg = err.message;
  return (
    msg.startsWith('Identificador de sesión') ||
    msg.startsWith('El identificador de sesión')
  );
}

export class TokenController {
  constructor(
    private readonly streamUseCase: StreamTokensUseCase,
    private readonly watcher: AntigravityTranscriptWatcherAdapter,
    private readonly quotaAdapter: GeminiApiClientAdapter,
    private readonly metricRepo: InMemoryMetricLogAdapter
  ) {}

  public obtenerSesionActiva = async (_req: Request, res: Response): Promise<void> => {
    try {
      const paquete = this.streamUseCase.getCurrentPacket();
      if (!paquete) {
        enviarRespuestaExitosa(res, 'No hay ninguna sesión activa iniciada aún', null);
        return;
      }
      enviarRespuestaExitosa(res, 'Métricas de sesión activa obtenidas exitosamente', paquete);
    } catch {
      enviarRespuestaError(res, 'Error al obtener sesión activa', 500);
    }
  };

  public listarSesiones = async (_req: Request, res: Response): Promise<void> => {
    try {
      const sesiones = this.watcher.listAvailableSessions();
      const current = this.watcher.currentSession;
      enviarRespuestaExitosa(res, 'Lista de sesiones de Antigravity recuperada', {
        sesionActivaId: current,
        totalSesiones: sesiones.length,
        sesiones,
      });
    } catch {
      enviarRespuestaError(res, 'Error al listar sesiones de Antigravity', 500);
    }
  };

  public cambiarSesion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, modelId } = req.body || {};
      if (!sessionId || typeof sessionId !== 'string') {
        enviarRespuestaError(res, 'El parámetro sessionId es requerido y debe ser una cadena válida.', 400);
        return;
      }

      const nuevoPaquete = await this.streamUseCase.switchSession(
        sessionId.trim(),
        modelId === 'gemini-2.5-flash' ? 'gemini-2.5-flash' : 'gemini-2.5-pro'
      );

      enviarRespuestaExitosa(res, `Sesión cambiada exitosamente a ${sessionId}`, nuevoPaquete);
    } catch (err: unknown) {
      if (err instanceof ErrorValidacionRuta) {
        enviarRespuestaError(res, err.mensajeCliente, 403);
        return;
      }
      if (err instanceof Error && esErrorValidacionSesion(err)) {
        enviarRespuestaError(res, err.message, 400);
        return;
      }
      enviarRespuestaError(res, 'Sesión no encontrada.', 404);
    }
  };

  public cambiarModelo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { modelId } = req.body || {};
      if (!modelId || (modelId !== 'gemini-2.5-pro' && modelId !== 'gemini-2.5-flash')) {
        enviarRespuestaError(res, "Modelo inválido. Opciones válidas: 'gemini-2.5-pro' | 'gemini-2.5-flash'", 400);
        return;
      }

      const nuevoPaquete = this.streamUseCase.setModel(modelId);
      if (!nuevoPaquete) {
        enviarRespuestaError(res, 'No hay sesión activa para aplicar el cambio de modelo', 404);
        return;
      }

      enviarRespuestaExitosa(res, `Modelo cambiado exitosamente a ${modelId}`, nuevoPaquete);
    } catch {
      enviarRespuestaError(res, 'Error al actualizar modelo', 500);
    }
  };

  public obtenerCuotas = async (req: Request, res: Response): Promise<void> => {
    try {
      const modelId = (req.query.modelId as string) === 'gemini-2.5-flash' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
      const cuotas = this.quotaAdapter.getModelQuota(modelId);
      enviarRespuestaExitosa(res, 'Cuotas y límites oficiales de Gemini recuperados', cuotas);
    } catch {
      enviarRespuestaError(res, 'Error al obtener cuotas', 500);
    }
  };

  public obtenerHistorial = async (_req: Request, res: Response): Promise<void> => {
    try {
      const logs = this.metricRepo.getRecentLogs(100);
      enviarRespuestaExitosa(res, 'Historial reciente de telemetría', logs);
    } catch {
      enviarRespuestaError(res, 'Error al recuperar historial', 500);
    }
  };
}
