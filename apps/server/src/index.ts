import http from 'node:http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AntigravityTranscriptWatcherAdapter } from '@antigravity/local-ingest';
import { GeminiApiClientAdapter } from './infrastructure/gemini/GeminiApiClientAdapter.js';
import { InMemoryMetricLogAdapter } from './infrastructure/logging/InMemoryMetricLogAdapter.js';
import { StreamTokensUseCase } from './application/use-cases/StreamTokensUseCase.js';
import { TokenController } from './interfaces/http/controllers/TokenController.js';
import { createTokenRoutes } from './interfaces/http/routes/TokenRoutes.js';
import { TokenWebSocketServer } from './interfaces/ws/TokenWebSocketServer.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 3001;
const BIND_HOST = process.env.BIND_HOST || '127.0.0.1';

// Configuración de CORS segura
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones locales sin origin (curl, cli) o de la SPA autorizada
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origen CORS no autorizado: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Sonda operativa de salud
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Inicialización de componentes de infraestructura y dominio DDD
const watcherAdapter = new AntigravityTranscriptWatcherAdapter();
const quotaAdapter = new GeminiApiClientAdapter();
const metricRepo = new InMemoryMetricLogAdapter();

const streamUseCase = new StreamTokensUseCase(watcherAdapter, quotaAdapter, metricRepo);
const tokenController = new TokenController(streamUseCase, watcherAdapter, quotaAdapter, metricRepo);

// Rutas de API REST
app.use('/api/v1', createTokenRoutes(tokenController));

// Servidor WebSocket Reactivo
const wsServer = new TokenWebSocketServer(streamUseCase);
wsServer.initialize(server);

// Iniciar con la sesión más reciente si existe
void streamUseCase.initializeWithLatestSession().then((packet) => {
  if (packet) {
    console.log(`[TokenLens Engine] Sesión activa inicializada: ${packet.sessionId} (${packet.tokens.totalAccumulated} tokens acumulados)`);
  } else {
    console.log('[TokenLens Engine] Listo a la espera de sesiones de Antigravity');
  }
});

server.listen(PORT, BIND_HOST, () => {
  console.log(`[TokenLens Engine] Servidor HTTP y WebSocket escuchando en http://${BIND_HOST}:${PORT}`);
  console.log(`[TokenLens Engine] WebSocket activo en ws://${BIND_HOST}:${PORT}/ws`);
  console.log(`[TokenLens Engine] Sonda de salud disponible en http://${BIND_HOST}:${PORT}/health`);
});

// Manejo de apagado elegante
const shutdown = () => {
  console.log('\n[TokenLens Engine] Deteniendo observadores y cerrando servidor...');
  watcherAdapter.stopWatching();
  wsServer.shutdown();
  server.close(() => {
    console.log('[TokenLens Engine] Servidor cerrado con éxito.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
