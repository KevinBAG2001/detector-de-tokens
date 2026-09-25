import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

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

/**
 * Validador estricto de seguridad para rutas de logs.
 * Regla: Toda ruta debe pertenecer inequívocamente a ANTIGRAVITY_LOGS_ROOT.
 * Previene Path Traversal y ataques de symlinks mediante resolución canónica fs.realpathSync.
 */
export function validarRutaLogs(rutaSolicitada: string): string {
  const logsRoot = getAntigravityLogsRoot();

  // Asegurar que la raíz exista
  if (!fs.existsSync(logsRoot)) {
    throw new Error(`El directorio raíz de logs de Antigravity no existe: ${logsRoot}`);
  }

  const realLogsRoot = fs.realpathSync(logsRoot);
  const resolvedPath = path.resolve(logsRoot, rutaSolicitada);

  // Verificar si el archivo o directorio existe
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`La ruta solicitada no existe dentro del contenedor de logs: ${rutaSolicitada}`);
  }

  // Canonizar la ruta para resolver cualquier enlace simbólico
  const canonicalPath = fs.realpathSync(resolvedPath);

  // Normalizar separadores para comparaciones seguras en Windows y Unix
  const normRoot = realLogsRoot.toLowerCase().replace(/\\/g, '/');
  const normTarget = canonicalPath.toLowerCase().replace(/\\/g, '/');

  if (!normTarget.startsWith(normRoot)) {
    throw new Error(`Acceso denegado: La ruta '${rutaSolicitada}' intenta escapar del directorio raíz autorizado.`);
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
  // Rechazar separadores de directorios y secuencias de escape
  if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) {
    throw new Error('El identificador de sesión contiene caracteres o secuencias de escape no permitidos.');
  }

  // Validar formato UUID o hash alfanumérico seguro
  const regexSeguro = /^[a-zA-Z0-9_-]+$/;
  if (!regexSeguro.test(trimmed)) {
    throw new Error('El identificador de sesión contiene caracteres no válidos.');
  }

  return trimmed;
}
