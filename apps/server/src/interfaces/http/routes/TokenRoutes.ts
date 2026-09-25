import { Router } from 'express';
import { TokenController } from '../controllers/TokenController.js';

export function createTokenRoutes(controller: TokenController): Router {
  const router = Router();

  router.get('/sesiones/activa', controller.obtenerSesionActiva);
  router.get('/sesiones', controller.listarSesiones);
  router.post('/sesiones/cambiar', controller.cambiarSesion);
  router.post('/modelo', controller.cambiarModelo);
  router.get('/cuotas', controller.obtenerCuotas);
  router.get('/historial', controller.obtenerHistorial);

  return router;
}
