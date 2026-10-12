# @antigravity/web

Vista SPA secundaria del Liquid Token Lens. Los datos en pantalla provienen del motor local (`apps/server`).

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
