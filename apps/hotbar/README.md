# @antigravity/hotbar

Shell nativo **Tauri 2** (bandeja del sistema + ventana compacta) para métricas de tokens Antigravity/Google leídas **on-device** desde logs locales. Es la dirección principal de UX del producto; la SPA web (`@antigravity/web`) sigue disponible como vista secundaria.

## Requisitos

- **Node.js** ≥ 20 y **pnpm** ≥ 9 (monorepo raíz).
- **Rust** ≥ 1.90 (ver `src-tauri/rust-toolchain.toml`) + dependencias de Tauri:
  - [Windows](https://tauri.app/start/prerequisites/#windows)
  - [Linux](https://tauri.app/start/prerequisites/#linux) (`webkit2gtk`, `rsvg2`, etc.)
- macOS: previsto en iteraciones posteriores.

## Desarrollo (Windows / Linux)

Desde la raíz del monorepo:

```bash
pnpm install
pnpm --filter @antigravity/local-ingest build
pnpm --filter @antigravity/hotbar dev
```

Esto compila el CLI de ingesta local y arranca `tauri dev`. El script `scripts/tauri-dev.mjs` elige un puerto libre (por defecto desde **1420**), escribe un JSON temporal de override y pasa su ruta a `tauri dev --config` (compatible Windows/Linux); Vite usa `HOTBAR_DEV_PORT` y `strictPort: false`.

Para forzar un puerto concreto: `HOTBAR_DEV_PORT=1430 pnpm --filter @antigravity/hotbar dev`.

### Variables de entorno

Igual que el servidor: opcionalmente `ANTIGRAVITY_LOGS_ROOT` apuntando al directorio `brain` de Antigravity (por defecto `~/.gemini/antigravity-ide/brain`).

## Build de escritorio

```bash
pnpm --filter @antigravity/local-ingest build
pnpm --filter @antigravity/hotbar build:desktop
```

Artefactos en `apps/hotbar/src-tauri/target/release/`.

> **Nota v1:** la lectura de tokens invoca el CLI Node de `@antigravity/local-ingest` desde el proceso Rust. El empaquetado del sidecar Node dentro del instalador es trabajo de seguimiento; en desarrollo se usa el monorepo + Node en `PATH`.

## Arquitectura de lectura de tokens

| Capa | Responsabilidad |
|------|-----------------|
| `@antigravity/local-ingest` | Parser JSONL, validación `validarRutaLogs`, snapshot CLI |
| Comando Tauri `fetch_antigravity_snapshot` | Ejecuta `node dist/cli/snapshot.js` con cwd en `packages/local-ingest` (sin `NODE_PATH` heredado) |
| UI React | Muestra métricas; stubs Cursor / procesos / Docker |

## Stubs (v1)

- **Cursor:** adaptador deshabilitado (`src/adapters/cursorAdapter.ts`).
- **Procesos dev / Docker:** placeholders sin llamadas reales al sistema.

## Bandeja del sistema

- Clic izquierdo en el icono: mostrar/ocultar ventana.
- Menú contextual: mostrar/ocultar, actualizar métricas, salir.
- Cerrar la ventana la oculta (la app permanece en bandeja).
- Al arrancar la ventana queda **oculta** (solo bandeja); sin barra de título ni entrada en la barra de tareas (overlay compacto).

## Prueba local (Windows / Linux)

Tras `git pull` de la rama con estos cambios:

```bash
pnpm install
pnpm --filter @antigravity/domain-core build
pnpm --filter @antigravity/local-ingest build
pnpm --filter @antigravity/hotbar dev
```

1. Comprobar que el icono aparece en la bandeja y **no** hay ventana al inicio.
2. Clic en la bandeja: panel compacto sin decoraciones, siempre encima, arrastrable desde la cabecera.
3. Panel Antigravity: debe mostrar JSON válido (métricas o mensaje «sin sesiones»), no error de stdout vacío / `EISDIR`.
4. Opcional: `cd packages/local-ingest && node dist/cli/snapshot.js` — misma salida que usa Rust.
5. Relanzar `pnpm --filter @antigravity/hotbar dev` varias veces: no debe fallar con «Port 1420 is already in use» (el script reserva otro puerto libre).

Si Antigravity no tiene logs, el panel muestra el mensaje del CLI (`available: false`), no números inventados.
