import type { Server as HttpServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { StreamTokensUseCase, TokenTelemetryStreamPacket } from '../../application/use-cases/StreamTokensUseCase.js';

export class TokenWebSocketServer {
  private wss: WebSocketServer | null = null;
  private unsubscribeUseCase: (() => void) | null = null;

  constructor(private readonly streamUseCase: StreamTokensUseCase) {}

  public initialize(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      // Validar token LAN si está configurado
      const bindHost = process.env.BIND_HOST || '127.0.0.1';
      const lanToken = process.env.TOKEN_LENS_API_TOKEN;
      const isLoopback = bindHost === '127.0.0.1' || bindHost === 'localhost' || bindHost === '::1';

      if (!isLoopback && lanToken) {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const tokenQuery = url.searchParams.get('token');
        if (tokenQuery !== lanToken) {
          ws.close(4001, 'Token de autorización LAN requerido o inválido');
          return;
        }
      }

      // Enviar paquete actual al conectarse
      const currentPacket = this.streamUseCase.getCurrentPacket();
      if (currentPacket && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'telemetry_packet', data: currentPacket }));
      }

      // Escuchar comandos del cliente
      ws.on('message', async (rawMessage) => {
        try {
          const messageStr = rawMessage.toString();
          const parsed = JSON.parse(messageStr);

          if (parsed.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          } else if (parsed.type === 'switch_session' && parsed.sessionId) {
            await this.streamUseCase.switchSession(parsed.sessionId, parsed.modelId);
          } else if (parsed.type === 'set_model' && parsed.modelId) {
            this.streamUseCase.setModel(parsed.modelId);
          }
        } catch {
          // Ignorar mensajes malformados
        }
      });
    });

    // Suscribir el WebSocket Server al flujo de eventos del caso de uso
    this.unsubscribeUseCase = this.streamUseCase.subscribe((packet: TokenTelemetryStreamPacket) => {
      this.broadcast({ type: 'telemetry_packet', data: packet });
    });
  }

  public broadcast(payload: Record<string, any>): void {
    if (!this.wss) return;
    const json = JSON.stringify(payload);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    }
  }

  public shutdown(): void {
    if (this.unsubscribeUseCase) {
      this.unsubscribeUseCase();
      this.unsubscribeUseCase = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}
