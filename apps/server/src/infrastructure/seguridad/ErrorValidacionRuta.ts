/**
 * Error de validación de rutas con mensaje seguro para el cliente.
 * El detalle interno se registra en logs del servidor, no en respuestas HTTP.
 */
export class ErrorValidacionRuta extends Error {
  readonly mensajeCliente: string;

  constructor(mensajeCliente: string, detalleInterno: string) {
    super(mensajeCliente);
    this.name = 'ErrorValidacionRuta';
    this.mensajeCliente = mensajeCliente;
    console.error('[seguridad/validarRutaLogs]', detalleInterno);
  }
}
