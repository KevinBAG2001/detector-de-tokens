# @antigravity/web

Vista SPA secundaria del Liquid Token Lens. Los datos en pantalla provienen del motor local (`apps/server`).

**Referencia de diseño:** componentes en `apps/web` y paquete `@antigravity/ui-liquid`. La carpeta local `.frontend/` (mockups HTML) **no forma parte del repositorio** y debe eliminarse si existe en tu máquina.

## API local

Si abres solo `pnpm dev:web`, verás **API local no disponible** (sin reintentos agresivos ni errores en consola).

Para telemetría HTTP/WebSocket:

```bash
pnpm dev:server
```

En otra terminal:

```bash
pnpm dev:web
```

La UX principal con datos 100 % locales (transcripciones + logs IDE) es **`pnpm --filter @antigravity/hotbar dev`**.
