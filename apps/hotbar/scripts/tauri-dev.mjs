import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { findFreePort } from './find-free-port.mjs';

const hotbarRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const preferredPort = Number(process.env.HOTBAR_DEV_PORT) || 1420;

const port = await findFreePort(preferredPort);

const env = {
  ...process.env,
  HOTBAR_DEV_PORT: String(port),
};

const configOverride = JSON.stringify({
  build: {
    devUrl: `http://localhost:${port}`,
  },
});

console.log(`[hotbar] Vite/Tauri dev en http://localhost:${port}`);

const child = spawn('pnpm', ['exec', 'tauri', 'dev', '--config', configOverride], {
  cwd: hotbarRoot,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('[hotbar] No se pudo arrancar tauri dev:', err);
  process.exit(1);
});
