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

Esto compila el CLI de ingesta local y arranca `tauri dev` (Vite en `http://localhost:1420`).

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
| Comando Tauri `fetch_antigravity_snapshot` | Ejecuta `node packages/local-ingest/dist/cli/snapshot.js` |
| UI React | Muestra métricas; stubs Cursor / procesos / Docker |

## Stubs (v1)

- **Cursor:** adaptador deshabilitado (`src/adapters/cursorAdapter.ts`).
- **Procesos dev / Docker:** placeholders sin llamadas reales al sistema.

## Bandeja del sistema

- Clic izquierdo en el icono: mostrar/ocultar ventana.
- Menú contextual: mostrar/ocultar, actualizar métricas, salir.
- Cerrar la ventana la oculta (la app permanece en bandeja).
