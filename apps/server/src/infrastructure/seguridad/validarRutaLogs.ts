import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ErrorValidacionRuta } from './ErrorValidacionRuta.js';

/**
 * Obtiene la ruta raíz autorizada para inspección de logs de Antigravity.
 * Por defecto: ~/.gemini/antigravity-ide/brain/
 */
export function getAntigravityLogsRoot(): string {
  const envRoot = process.env.ANTIGRAVITY_LOGS_ROOT;
  if (envRoot && envRoot.trim() !== '') {
    return path.resolve(envRoot.trim());
  }
  return path.join(os.homedir(), '.gemini', 'antigravity-ide', 'brain');
}

function perteneceARaizLogs(normRoot: string, normTarget: string): boolean {
  return normTarget === normRoot || normTarget.startsWith(`${normRoot}/`);
}

/**
 * Validador estricto de seguridad para rutas de logs.
 * Regla: Toda ruta debe pertenecer inequívocamente a ANTIGRAVITY_LOGS_ROOT.
 * Previene Path Traversal y ataques de symlinks mediante resolución canónica fs.realpathSync.
 */
export function validarRutaLogs(rutaSolicitada: string): string {
  const logsRoot = getAntigravityLogsRoot();

  if (!fs.existsSync(logsRoot)) {
    throw new ErrorValidacionRuta(
      'El directorio raíz de logs no está disponible.',
      `El directorio raíz de logs de Antigravity no existe: ${logsRoot}`
    );
  }

  const realLogsRoot = fs.realpathSync(logsRoot);
  const resolvedPath = path.resolve(logsRoot, rutaSolicitada);

  if (!fs.existsSync(resolvedPath)) {
    throw new ErrorValidacionRuta(
      'La ruta solicitada no existe.',
      `La ruta solicitada no existe dentro del contenedor de logs: ${rutaSolicitada} (resuelta: ${resolvedPath})`
    );
  }

  const canonicalPath = fs.realpathSync(resolvedPath);

  const normRoot = realLogsRoot.toLowerCase().replace(/\\/g, '/');
  const normTarget = canonicalPath.toLowerCase().replace(/\\/g, '/');

  if (!perteneceARaizLogs(normRoot, normTarget)) {
    throw new ErrorValidacionRuta(
      'Ruta no permitida.',
      `Acceso denegado: canonical '${canonicalPath}' fuera de raíz '${realLogsRoot}' (solicitud: '${rutaSolicitada}')`
    );
  }

  return canonicalPath;
}

/**
 * Validador para identificadores de sesión (UUIDs o carpetas alfanuméricas simples).
 */
export function validarSessionId(sessionId: string): string {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Identificador de sesión inválido.');
  }

  const trimmed = sessionId.trim();
  if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) {
    throw new Error('El identificador de sesión contiene caracteres o secuencias de escape no permitidos.');
  }

  const regexSeguro = /^[a-zA-Z0-9_-]+$/;
  if (!regexSeguro.test(trimmed)) {
    throw new Error('El identificador de sesión contiene caracteres no válidos.');
  }

  return trimmed;
}
