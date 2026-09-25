# Antigravity Liquid Token Lens 🌊⚡

> **Monitor reactivo y visualizador de cuotas y tokens para Google Antigravity y modelos Gemini en tiempo real, con estética táctil "Liquid Glass".**

[![CI Pipeline](https://github.com/usuario/antigravity-liquid-token-lens/actions/workflows/ci.yml/badge.svg)](https://github.com)
[![Gestor de Paquetes](https://img.shields.io/badge/pnpm-v11.25-orange.svg)](https://pnpm.io/)
[![Arquitectura](https://img.shields.io/badge/Arquitectura-DDD%20Hexagonal-blue.svg)](https://martinfowler.com/tags/domain%20driven%20design.html)
[![Privacidad](https://img.shields.io/badge/Seguridad-Zero--Leakage-emerald.svg)](https://github.com)

---

## 📖 Visión del Proyecto

Al orquestar flujos de trabajo con agentes autónomos en **Google Antigravity** y la familia de modelos **Gemini** (Gemini 2.5 Pro y Flash), la visibilidad del consumo de contexto suele ser opaca.

**Antigravity Liquid Token Lens** resuelve este problema mediante una arquitectura local-first reactiva:
- 🧪 **Metáfora Visual de Fluido Líquido:** Un contenedor de cristal translúcido que simula la subida de un líquido con oleaje senoidal dinámico y filtros de refracción óptica SVG (`feTurbulence` / `feDisplacementMap`).
- 🚦 **Semáforo Cromático de Saturación:**
  - 🔵 **Fase Segura (< 70%):** Fluido Cian Neón (`#00F0FF`) con oleaje suave y resplandor cristalino.
  - 🟡 **Fase de Alerta (70% - 85%):** Fluido Ámbar Eléctrico (`#F59E0B`) con oleaje acelerado y cáusticos.
  - 🔴 **Fase Crítica (> 85%):** Fluido Carmesí Lava (`#EF4444`) con pulsación estroboscópica de alerta.
- 🔒 **Política Estricta Zero-Leakage:** Procesamiento 100% On-Device. El lector de logs extrae exclusivamente métricas numéricas y timestamps, **sin acceder, procesar ni transmitir código de usuario, archivos ni prompts**.
- 📊 **Desglose Granular:** Control exacto entre tokens de Prompt, Output/Candidates, Cached (descuento masivo) y Thinking (razonamiento interno).
- ⏱️ **Límites de Velocidad (Rate Limits):** Monitoreo continuo de TPM y RPM con cuenta regresiva para el reseteo de ventana.
- 💵 **Estimador Financiero:** Conversión automática a costos monetarios reales en USD ($) según el tarifario vigente de Gemini.

---

## 🏛️ Arquitectura del Monorepo

El proyecto está organizado como un Monorepo gestionado exclusivamente con **`pnpm workspaces`** y orquestado mediante **Turborepo**:

```text
antigravity-liquid-token-lens/
├── apps/
│   ├── server/                     # Backend Node.js + Express + WebSocket + Chokidar
│   │   └── src/
│   │       ├── application/        # Casos de uso (StreamTokensUseCase, CalculateCostsUseCase)
│   │       ├── domain/             # Contratos de repositorios y cuotas
│   │       ├── infrastructure/     # Observador de transcripciones locales y cliente Gemini
│   │       └── interfaces/         # Endpoints REST y servidor WebSocket
│   │
│   └── web/                        # Frontend SPA React 19 + Vite 6 + Tailwind 4
│       └── src/
│           ├── components/
│           │   ├── ui/             # Primitivos shadcn (LiquidGlassCard)
│           │   └── features/       # Tarjetas de negocio (TokenLiquidCard, GranularBreakdown)
│           ├── application/        # Hooks reactivos (useTokenStream)
│           └── infrastructure/     # Cliente HTTP único (HttpTokenApi)
│
├── packages/
│   └── domain-core/                # Núcleo puro de Dominio DDD (Sin dependencias a frameworks)
│       └── src/
│           ├── value-objects/      # GranularTokenCount, FillLevel, CurrencyCost, RateLimitWindow
│           ├── aggregates/         # TokenSessionAggregate (Root Aggregate)
│           └── events/             # DomainEvents (TokenBatchConsumed, QuotaThresholdCrossed)
│
├── .github/workflows/              # Pipeline de integración continua (CI)
├── .npmrc                          # Configuración estricta de aislamiento pnpm
├── pnpm-workspace.yaml             # Definición de paquetes del workspace
├── turbo.json                      # Orquestador de builds con pipelines cacheados
└── PRD.md                          # Documento de Requisitos de Producto (Master Blueprint)
```

---

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js:** `>= 20.0.0`
- **pnpm:** `>= 9.0.0` (o `11.x`)

### 1. Clonar e Instalar Dependencias
```bash
git clone https://github.com/tu-usuario/antigravity-liquid-token-lens.git
cd antigravity-liquid-token-lens
pnpm install
```

### 2. Configuración de Entorno (Opcional)
```bash
cp .env.example .env
```
*Por defecto, el sistema autodetecta las sesiones de Antigravity en `~/.gemini/antigravity-ide/brain/` sin necesidad de configuración adicional.*

### 3. Ejecutar en Modo Desarrollo

#### Opción A: Levantar todo concurrentemente con Turborepo
```bash
pnpm dev
```

#### Opción B: Ejecutar servicios de forma independiente
```bash
# Terminal 1: Motor backend y servidor WebSocket (Puerto 3001)
pnpm dev:server

# Terminal 2: Interfaz web React 19 Liquid Glass (Puerto 5174)
pnpm dev:web
```

Abre tu navegador en `http://localhost:5174`.

---

## 🧪 Pruebas y Compilación

```bash
# Ejecutar todas las suites de pruebas unitarias (Vitest)
pnpm test

# Compilar todos los paquetes del monorepo (Turbo Build)
pnpm build
```

---

## 🛡️ Seguridad y Privacidad

- **Canonización de Rutas:** El lector local utiliza `fs.realpathSync` para rechazar enlaces simbólicos o intentos de Path Traversal fuera de `ANTIGRAVITY_LOGS_ROOT`.
- **Zero-Leakage:** La telemetría transmitida por WebSocket responde exclusivamente al contrato tipado `TokenTelemetryStreamPacket`, garantizando que ninguna información sensible del código de trabajo abandone la máquina.

---

## 📜 Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.
