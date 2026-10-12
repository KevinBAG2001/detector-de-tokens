import path from 'node:path';

/**
 * Resuelve %APPDATA% en Windows con respaldo USERPROFILE\\AppData\\Roaming.
 */
export function resolveWindowsAppDataRoaming(
  env: NodeJS.ProcessEnv = process.env
): string | null {
  const appData = env.APPDATA?.trim();
  if (appData) {
    return appData;
  }

  const userProfile = env.USERPROFILE?.trim();
  if (userProfile) {
    return path.join(userProfile, 'AppData', 'Roaming');
  }

  return null;
}
