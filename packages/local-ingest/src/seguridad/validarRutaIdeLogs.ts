import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ErrorValidacionRuta } from './ErrorValidacionRuta.js';

function perteneceARaiz(normRoot: string, normTarget: string): boolean {
  return normTarget === normRoot || normTarget.startsWith(`${normRoot}/`);
}

/**
 * Raíz de logs de la aplicación Antigravity IDE (errores LS / renderer).
 * Windows: %APPDATA%\\Antigravity IDE\\logs
 * Linux/macOS: ~/.config/Antigravity IDE/logs
 */
export function getAntigravityIdeLogsRoot(): string {
  const envRoot = process.env.ANTIGRAVITY_IDE_LOGS_ROOT;
  if (envRoot && envRoot.trim() !== '') {
    return path.resolve(envRoot.trim());
  }

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA;
    if (appData && appData.trim() !== '') {
      return path.join(appData, 'Antigravity IDE', 'logs');
    }
  }

  const configHome = process.env.XDG_CONFIG_HOME;
  if (configHome && configHome.trim() !== '') {
    return path.join(configHome, 'Antigravity IDE', 'logs');
  }

  return path.join(os.homedir(), '.config', 'Antigravity IDE', 'logs');
}

/**
 * Validador estricto de rutas bajo ANTIGRAVITY_IDE_LOGS_ROOT (realpath + frontera).
 */
export function validarRutaIdeLogs(rutaSolicitada: string): string {
  const logsRoot = getAntigravityIdeLogsRoot();

  if (!fs.existsSync(logsRoot)) {
    throw new ErrorValidacionRuta(
      'El directorio raíz de logs IDE no está disponible.',
      `El directorio raíz de logs IDE de Antigravity no existe: ${logsRoot}`
    );
  }

  const realLogsRoot = fs.realpathSync(logsRoot);
  const resolvedPath = path.resolve(logsRoot, rutaSolicitada);

  if (!fs.existsSync(resolvedPath)) {
    throw new ErrorValidacionRuta(
      'La ruta solicitada no existe.',
      `La ruta solicitada no existe dentro del contenedor de logs IDE: ${rutaSolicitada} (resuelta: ${resolvedPath})`
    );
  }

  const canonicalPath = fs.realpathSync(resolvedPath);

  const normRoot = realLogsRoot.toLowerCase().replace(/\\/g, '/');
  const normTarget = canonicalPath.toLowerCase().replace(/\\/g, '/');

  if (!perteneceARaiz(normRoot, normTarget)) {
    throw new ErrorValidacionRuta(
      'Ruta no permitida.',
      `Acceso denegado: canonical '${canonicalPath}' fuera de raíz IDE '${realLogsRoot}' (solicitud: '${rutaSolicitada}')`
    );
  }

  return canonicalPath;
}
