import { spawn } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
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

const configPath = join(tmpdir(), `hotbar-tauri-dev-${randomUUID()}.json`);
writeFileSync(
  configPath,
  `${JSON.stringify({ build: { devUrl: `http://localhost:${port}` } }, null, 2)}\n`,
  'utf8',
);

const removeConfigFile = () => {
  try {
    unlinkSync(configPath);
  } catch {
    // ignorar
  }
};

console.log(`[hotbar] Vite/Tauri dev en http://localhost:${port}`);

const tauriCli = join(hotbarRoot, 'node_modules', '@tauri-apps', 'cli', 'tauri.js');

const child = spawn(process.execPath, [tauriCli, 'dev', '--config', configPath], {
  cwd: hotbarRoot,
  env,
  stdio: 'inherit',
  shell: false,
});

const shutdown = (code, signal) => {
  removeConfigFile();
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
};

child.on('exit', (code, signal) => shutdown(code, signal));

child.on('error', (err) => {
  removeConfigFile();
  console.error('[hotbar] No se pudo arrancar tauri dev:', err);
  process.exit(1);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    removeConfigFile();
    child.kill(sig);
  });
}
