# @antigravity/hotbar

Shell nativo **Tauri 2** (bandeja del sistema + ventana compacta) para métricas de tokens Antigravity/Google leídas **on-device** desde logs locales. Es la dirección principal de UX del producto; la SPA web (`@antigravity/web`) sigue disponible como vista secundaria.

## Requisitos

- **Node.js** ≥ 20 y **pnpm** ≥ 9 (monorepo raíz).
- **Rust** ≥ 1.90 (ver `src-tauri/rust-toolchain.toml`) + dependencias de Tauri:
  - [Windows](https://tauri.app/start/prerequisites/#windows)
  - [Linux](https://tauri.app/start/prerequisites/#linux) (`webkit2gtk`, `rsvg2`, etc.)
- macOS: previsto en iteraciones posteriores.

## Desarrollo (Windows / Linux)

Desde la raíz del monorepo (tras `pnpm install`):

```bash
pnpm --filter @antigravity/hotbar dev
```

Un solo comando: compila ingesta local, arranca Vite en un puerto libre y lanza Tauri (el puerto y el `devUrl` se alinean automáticamente; sin pasos extra).

Tras abrir el panel, la tarjeta **Google Antigravity** debe mostrar métricas o un mensaje tipo «sin sesiones» — no `EISDIR` ni «Salida vacía del CLI».

### Variables de entorno

Opcionalmente `ANTIGRAVITY_LOGS_ROOT` apuntando al directorio `brain` de Antigravity (por defecto `~/.gemini/antigravity-ide/brain`).

## Build de escritorio

```bash
pnpm --filter @antigravity/hotbar build:desktop
```

Artefactos en `apps/hotbar/src-tauri/target/release/`.

> **Nota v1:** la lectura de tokens invoca el CLI Node de `@antigravity/local-ingest` desde el proceso Rust. El empaquetado del sidecar Node dentro del instalador es trabajo de seguimiento; en desarrollo se usa el monorepo + Node en `PATH`.

## Arquitectura de lectura de tokens

| Capa | Responsabilidad |
|------|-----------------|
| `@antigravity/local-ingest` | Parser JSONL, validación `validarRutaLogs`, cuota IDE (429) vía `ANTIGRAVITY_IDE_LOGS_ROOT`, snapshot CLI |
| Comando Tauri `fetch_antigravity_snapshot` | `node dist/cli/snapshot.js` (ruta relativa, cwd sin `\\?\`) en `packages/local-ingest`; fallback `pnpm run snapshot` en Windows |
| UI React | Muestra métricas; stubs Cursor / procesos / Docker |

## Stubs (v1)

- **Cursor:** adaptador deshabilitado (`src/adapters/cursorAdapter.ts`).
- **Procesos dev / Docker:** placeholders sin llamadas reales al sistema.

## Bandeja del sistema

- Clic izquierdo en el icono: mostrar/ocultar ventana.
- Menú contextual: mostrar/ocultar, actualizar métricas, salir.
- Cerrar la ventana la oculta (la app permanece en bandeja).
- Al arrancar se muestra el **panel overlay** (sin barra de título ni entrada en la barra de tareas); la bandeja sirve para mostrar/ocultar (clic izquierdo) y menú (clic derecho).
