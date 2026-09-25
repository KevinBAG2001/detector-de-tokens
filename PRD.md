# Product Requirements Document (PRD) — Enterprise Master Edition
# Proyecto: Antigravity Liquid Token Lens (Monitor y Visualizador de Cuotas y Tokens)

**Versión:** 2.0.0 (Master Blueprint — Production Ready)  
**Gestor de Paquetes Exclusivo:** `pnpm` (Estándar de seguridad, cache inmutable y workspaces de ultra-alta velocidad)  
**Arquitectura:** Domain-Driven Design (DDD) Estricto + Arquitectura Hexagonal (Puertos y Adaptadores)  
**Ecosistema Monorepo:** `pnpm workspaces` + Turborepo  
**Backend / Streaming Core:** High-Performance Reactive Engine (Dart Frog / Go / Fastify Node con WebSockets & SSE)  
**Frontend Web:** React 19 / TypeScript 5.8 / Tailwind CSS / shadcn/ui / `motion/react` (Liquid Glass con refracción óptica SVG)  
**Frontend Mobile & Desktop:** Flutter 3.x / Dart (Motor Impeller, Shaders GLSL y CustomPainter líquido matemático)  
**Estilo Visual:** Liquid Glass (Cristal translúcido interactivo, refracción física, oleaje senoidal y semáforo cromático de saturación)

---

## 1. Visión del Producto y Objetivos Estratégicos

### 1.1 Declaración del Problema
Al desarrollar y orquestar flujos de trabajo con agentes de IA autónomos en **Google Antigravity** y la familia de modelos **Gemini** (Gemini 2.5 Pro, Flash, modelos con razonamiento/Thinking), los ingenieros operan a ciegas respecto a:
1. **Agotamiento Inesperado del Contexto (Context Exhaustion):** No existe visibilidad táctil de cuántos tokens quedan disponibles en la ventana activa (1M / 2M tokens) antes de que el agente compacte, resuma forzadamente o falle a mitad de una tarea compleja.
2. **Falta de Desglose Granular en Tiempo Real:** Dificultad para discernir en vivo entre tokens de Prompt (archivos cargados, historial), tokens generados (Output/Candidates), tokens reutilizados con descuento (Cached Tokens) y tokens de razonamiento interno (Thinking Tokens).
3. **Saturación Súbita de Cuotas de Velocidad (Rate Limits):** Bloqueos repentinos por exceder TPM (Tokens por Minuto) o RPM (Peticiones por Minuto).
4. **Incertidumbre Financiera:** Cero telemetría de costo monetario instantáneo en dólares ($ USD) por interacción y por sesión acumulada.

### 1.2 La Solución: Antigravity Liquid Token Lens
Una suite de herramientas multiplataforma unificada mediante un monorepo `pnpm` y un núcleo DDD que implementa:
- **Metáfora Visual de Llenado Líquido:** Un contenedor de cristal líquido ultra-fluido que inicia vacío (cristalino, translúcido) y se va llenando de un fluido iridiscente conforme la conversación acumula tokens.
- **Física Dinámica de Alerta Cromática:**
  - **Fase Segura (< 70% de la ventana):** Fluido cian neón (`#00F0FF`) con ondas calmas y refracción luminosa.
  - **Fase de Advertencia (70% - 85%):** Fluido ámbar eléctrico (`#F59E0B`) con oleaje agitado y reflejos cáusticos.
  - **Fase Crítica (> 85%):** Fluido carmesí lava (`#EF4444`) con pulsación estroboscópica suave en los bordes del cristal.
- **Arquitectura Local-First y de Máxima Potencia:** Telemetría en tiempo real (< 50ms) con zero-leakage de código privado.

---

## 2. Ingesta de Datos: Arquitectura Híbrida Tripartita

El sistema implementa el patrón **Puertos y Adaptadores (Hexagonal / DDD)** mediante un adaptador compuesto (`HybridTokenTelemetryAdapter`):

```
                        ┌───────────────────────────────────────────────┐
                        │        HYBRID TOKEN TELEMETRY ADAPTER         │
                        └───────────────────────┬───────────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌──────────────────┐                 ┌──────────────────────┐               ┌──────────────────┐
│  Fuente 1 (Logs) │                 │   Fuente 2 (Cloud)   │               │ Fuente 3 (Cache) │
│ Antigravity Local│                 │ Gemini / AI Studio   │               │ Local Volatile   │
│ transcript.jsonl │                 │ REST / gRPC API Key  │               │ TPM Velocity     │
└──────────────────┘                 └──────────────────────┘               └──────────────────┘
```

### 2.1 Especificación del Parser de Transcripciones Locales (`transcript.jsonl`)
- **Ubicación:** `~/.gemini/antigravity-ide/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`
- **Mecanismo de Observación:** Watcher a nivel de kernel de SO (`fs.watch` con debounce de 35ms en Node o `Directory.watch` en Dart).
- **Esquema de Entrada JSONL en Antigravity:**
  ```json
  {
    "step_index": 12,
    "source": "MODEL",
    "type": "PLANNER_RESPONSE",
    "status": "DONE",
    "created_at": "2026-09-18T00:35:19Z",
    "content": "...",
    "tool_calls": [],
    "is_truncated": false
  }
  ```
- **Lógica de Extracción de Tokens:**
  1. Si la línea contiene metadatos directos de uso (`usageMetadata`), se extraen `promptTokenCount`, `candidatesTokenCount` y `cachedContentTokenCount`.
  2. En ausencia de metadatos explícitos, el motor aplica el tokenizer local de alta velocidad (BPE Gemini Tokenizer) sobre el delta de `content` y los inputs de herramientas.
  3. Soporte para subagentes: Detecta invocaciones a `invoke_subagent` y agrega el árbol de consumo de procesos secundarios al agregado de sesión principal.

### 2.2 Sincronización con la API de Google Gemini / Vertex AI
- Consulta mediante la clave oficial de Google AI Studio / Vertex AI:
  - Endpoint `models.countTokens` para predecir el impacto de un prompt antes de enviarlo.
  - Extracción de cabeceras de respuesta HTTP en llamadas activas:
    - `x-ratelimit-remaining-tokens-per-minute`
    - `x-ratelimit-limit-tokens-per-minute`
    - `x-ratelimit-remaining-requests-per-minute`

---

## 3. Arquitectura del Software: Domain-Driven Design (DDD)

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                             PRESENTATION LAYER                              │
 │  ┌─────────────────────────────────────────┐ ┌───────────────────────────┐  │
 │  │        React 19 / TypeScript Web        │ │   Flutter Desktop / Mobile│  │
 │  │  - LiquidGlassCard (SVG Turbulence)     │ │   - Impeller / GLSL Shader│  │
 │  │  - shadcn/ui + Tailwind CSS             │ │   - Liquid Wave Painter   │  │
 │  │  - motion/react animaciones y arrastre  │ │   - BLoC State Management │  │
 │  └────────────────────▲────────────────────┘ └─────────────▲─────────────┘  │
 └───────────────────────┼────────────────────────────────────┼────────────────┘
                         │          WebSocket Event Stream    │
                         └────────────────────┬───────────────┘
                                              ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                              APPLICATION LAYER                              │
 │  - GetActiveSessionTokenMetricsUseCase                                      │
 │  - StreamLiveTokenFlowUseCase                                               │
 │  - CalculateFinancialCostUseCase                                            │
 │  - EvaluateQuotaThresholdRulesUseCase                                       │
 │  - PredictPromptTokenImpactUseCase                                          │
 └────────────────────────────────────┬────────────────────────────────────────┘
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                DOMAIN LAYER                                 │
 │  ┌───────────────────────────────────────────────────────────────────────┐  │
 │  │ Agregados y Entidades:                                                │  │
 │  │  - TokenSessionAggregate (Root: controla estado, ventana y límites)   │  │
 │  │  - QuotaBudgetAggregate (Límites TPM/RPM, cuota del proyecto)         │  │
 │  │  - ModelPricingPolicy (Tarifario oficial Gemini 2.5 Pro / Flash)      │  │
 │  │ Value Objects Inmutables:                                             │  │
 │  │  - GranularTokenCount (prompt, output, cached, thinking, total)       │  │
 │  │  - CurrencyCost (usdValue, inputUSD, outputUSD, cacheSavingsUSD)      │  │
 │  │  - FillLevel (percentage 0.0 - 1.0, severity: safe | warning | alert) │  │
 │  │  - RateLimitWindow (remainingTokens, resetTime, capacity)             │  │
 │  │ Domain Events:                                                        │  │
 │  │  - TokenBatchConsumedEvent                                            │  │
 │  │  - QuotaThresholdCrossedEvent (70%, 85%, 95%)                         │  │
 │  │  - ContextExhaustionImminentEvent                                     │  │
 │  │ Puertos (Interfaces):                                                 │  │
 │  │  - ITokenTelemetryRepository                                          │  │
 │  │  - IQuotaProviderService                                              │  │
 │  │  - IPriceCalculatorService                                            │  │
 │  └───────────────────────────────────────────────────────────────────────┘  │
 └────────────────────────────────────▲────────────────────────────────────────┘
                                      │
 ┌────────────────────────────────────┴────────────────────────────────────────┐
 │                            INFRASTRUCTURE LAYER                             │
 │  - AntigravityTranscriptWatcher (Adaptador de logs fs.watch / Dart watcher) │
 │  - GeminiApiClientAdapter (Cliente REST/gRPC oficial de Google Gen AI)      │
 │  - HighPerformanceStreamingServer (WebSocket/SSE en Go / Dart / Fastify)   │
 │  - LocalStorageAdapter (SQLite / Drift para persistencia offline)           │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Máquina de Estados del Agregado `TokenSessionAggregate`

```
  [IDLE / VACÍO]
        │
        ▼ (Evento: TokenBatchConsumed)
  [CAPACIDAD_ÓPTIMA] (< 70% de llenado líquido)
        │
        ▼ (Tokens acumulados cruzan el 70%)
  [UMBRAL_ADVERTENCIA] (70% - 85% — Alerta ámbar, oleaje rápido)
        │
        ▼ (Tokens acumulados cruzan el 85%)
  [SATURACIÓN_CRÍTICA] (> 85% — Alerta carmesí lava, pulsación)
        │
        ▼ (Llenado alcanza el 100%)
  [VENTANA_AGOTADA] (Bloqueo predictivo para evitar fallo del agente)
```

### 3.2 Contrato de Eventos en Tiempo Real (WebSocket / SSE Protocol)
Todos los clientes (React Web y Flutter) reciben paquetes tipados bajo el siguiente contrato:

```typescript
export interface TokenTelemetryStreamPacket {
  eventId: string;
  timestamp: string;
  sessionId: string;
  model: {
    name: string;
    contextWindowLimit: number;
  };
  tokens: {
    prompt: number;
    output: number;
    cached: number;
    thinking: number;
    totalAccumulated: number;
  };
  gauge: {
    fillPercentage: number; // 0.0 a 100.0
    severity: 'safe' | 'warning' | 'critical';
    liquidColorHex: string;
  };
  rateLimits: {
    tpmRemaining: number;
    tpmLimit: number;
    rpmRemaining: number;
    rpmLimit: number;
    resetInSeconds: number;
  };
  financial: {
    costUSD: number;
    savingsUSD: number;
  };
}
```

---

## 4. Física y Especificación Matemática de "Liquid Glass"

### 4.1 Ecuación de la Superficie del Fluido (Ondas Armónicas Compuestas)
El nivel del líquido dentro de la tarjeta no es una barra estática, sino una superficie dinámica simulada con suma de ondas senoidales:

$$y(x, t) = \sum_{i=1}^{3} A_i \cdot \sin(\omega_i \cdot x + \phi_i \cdot t) + h_{\text{fill}}$$

Donde:
- $h_{\text{fill}} = \text{height} \times \text{fillPercentage}$: Altura base calculada según los tokens consumidos.
- $A_i$: Amplitud de la onda (aumenta proporcionalmente con la severidad del umbral).
- $\omega_i$: Frecuencia espacial.
- $\phi_i$: Velocidad angular de la animación en milisegundos.

### 4.2 Refracción Óptica del Cristal (Filtros SVG Nativos)
En React Web, el vidrio líquido se renderiza mediante un filtro de distorsión cáustica:
```xml
<filter id="glass-blur" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
  <feTurbulence type="fractalNoise" baseFrequency="0.003 0.007" numOctaves="2" result="turbulence" />
  <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="200" xChannelSelector="R" yChannelSelector="G" />
</filter>
```

### 4.3 Dinámica de Resortes en Tarjetas Flotantes (Física de Arrastre)
- **Rigidez del resorte (Bounce Stiffness):** `300`
- **Amortiguación (Bounce Damping):** `10`
- **Potencia inercial (Power):** `0.3`
- **Elasticidad al arrastrar (Drag Elasticity):** `0.3` con límites confinados a la ventana activa.

---

## 5. Estructura del Monorepo con `pnpm`

El proyecto se organiza bajo una arquitectura Monorepo robusta gestionada exclusivamente con **`pnpm`**:

```
antigravity-liquid-token-lens/
├── .npmrc                         # Configuración estricta de pnpm (shamefully-hoist=false)
├── pnpm-workspace.yaml            # Definición de paquetes y aplicaciones
├── package.json                   # Scripts raíz (pnpm dev, pnpm build, pnpm lint)
├── turbo.json                     # Orquestador de builds Turborepo
│
├── apps/
│   ├── web/                       # React 19 + TypeScript + Tailwind + shadcn/ui
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/            # Primitivos shadcn (@/components/ui/liquid-weather-glass.tsx)
│   │   │   │   └── features/      # Widgets de negocio (TokenLiquidCard.tsx)
│   │   │   ├── hooks/             # useTokenStream, useLiquidPhysics
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.ts
│   │
│   ├── mobile_desktop/            # Aplicación Flutter nativa (Desktop/Mobile)
│   │   ├── lib/
│   │   │   ├── domain/            # Modelos y entidades Dart
│   │   │   ├── presentation/      # Glassmorphic Widgets + LiquidWavePainter
│   │   │   └── main.dart
│   │   └── pubspec.yaml
│   │
│   └── streaming_server/          # Núcleo de alta velocidad (WebSockets / Watcher)
│       ├── src/
│       │   ├── watcher.ts         # Observador local de transcript.jsonl
│       │   ├── gemini-client.ts   # Integración con Google Gen AI SDK
│       │   └── ws-server.ts       # Servidor Fastify WebSocket
│       └── package.json
│
└── packages/
    ├── domain-core/               # Entidades DDD compartidas en TypeScript
    │   ├── src/
    │   │   ├── token-count.vo.ts
    │   │   ├── pricing-policy.ts
    │   │   └── fill-level.vo.ts
    │   └── package.json
    │
    └── tsconfig/                  # Configuraciones TypeScript compartidas
        └── base.json
```

---

## 6. Configuración e Instalación Paso a Paso con `pnpm`

### 6.1 Inicialización del Entorno con `pnpm`
```bash
# 1. Crear el directorio y el archivo de workspace pnpm
mkdir antigravity-token-lens && cd antigravity-token-lens
pnpm init

# 2. Configurar pnpm-workspace.yaml
echo "packages:
  - 'apps/*'
  - 'packages/*'" > pnpm-workspace.yaml

# 3. Crear la app web con Vite + React + TypeScript usando pnpm
pnpm create vite apps/web --template react-ts

# 4. Instalar dependencias de UI en la app web
cd apps/web
pnpm add motion lucide-react clsx tailwind-merge
pnpm add -D tailwindcss postcss autoprefixer @types/node

# 5. Inicializar Tailwind CSS y shadcn/ui con pnpm dlx
pnpm dlx tailwindcss init -p
pnpm dlx shadcn@latest init
```

### 6.2 ¿Por qué la carpeta `/components/ui` es inmutablemente necesaria?
1. **Regla de Oro de shadcn/ui:** La CLI de shadcn (`pnpm dlx shadcn@latest add`) inyecta automáticamente los componentes en `@/components/ui`. Alterar esta ruta rompe la automatización y las actualizaciones futuras.
2. **Separación Atómica de Dominio:** Los componentes en `/components/ui` son **agnósticos de la IA y de Antigravity**. `LiquidGlassCard` solo sabe renderizar un contenedor con refracción; `TokenLiquidCard` (en `components/features/`) es quien inyecta la lógica de tokens, costos y severidad.

---

## 7. Políticas de Seguridad, Privacidad y Rendimiento (SLOs)

### 7.1 Zero-Leakage Privacy Policy (Privacidad Absoluta Local)
- **Procesamiento 100% On-Device:** El observador de logs únicamente lee las marcas de conteo numérico de tokens y timestamps. **Ningún fragmento de código de usuario, archivo fuente o prompt es transmitido al exterior**.
- **Gestión Segura de API Keys:** Las credenciales de Google Gemini / Vertex AI se guardan en el llavero criptográfico del sistema operativo (Windows Credential Manager / macOS Keychain) y jamás se insertan en variables de entorno en texto plano ni se envían en el repositorio.

### 7.2 Service Level Objectives (SLOs)
| Métrica | Objetivo (SLO) | Método de Medición |
| :--- | :--- | :--- |
| **Latencia de Refresco UI** | $< 50$ ms | Desde la escritura en `transcript.jsonl` hasta la animación en pantalla |
| **Consumo de CPU en Idle** | $< 0.8\%$ | Medición continua del daemon de streaming |
| **Consumo de Memoria RAM** | $< 45$ MB | Proceso en segundo plano |
| **Fluidez de Renderizado** | $60 - 120$ FPS sostenidos | Monitor de frames de Chrome DevTools e Impeller HUD |

---

## 8. Matriz de Requisitos Funcionales Detallados

| Código | Requisito Funcional | Capa DDD | Prioridad |
| :--- | :--- | :--- | :--- |
| **RF-01** | Observador de archivos locales de logs `transcript.jsonl` de Antigravity con debouncing. | Infraestructura | **P0 (Crítico)** |
| **RF-02** | Agregación reactiva de tokens: Prompt, Candidates, Cached y Thinking. | Dominio | **P0 (Crítico)** |
| **RF-03** | Cálculo del porcentaje de ocupación de la ventana (1M para Flash / 2M para Pro). | Dominio | **P0 (Crítico)** |
| **RF-04** | Tarjeta visual `LiquidGlassCard` con shader/filtro de refracción líquida y soporte drag & drop. | Presentación | **P0 (Crítico)** |
| **RF-05** | Transición cromática de 3 etapas en el líquido: Cian (<70%), Ámbar (70-85%), Carmesí (>85%). | Presentación | **P0 (Crítico)** |
| **RF-06** | Calculadora financiera de costo en tiempo real (\$ USD) según el tarifario vigente de Gemini. | Aplicación | **P1 (Alto)** |
| **RF-07** | Estado colapsado (indicador minimalista) y expandido (desglose por categoría de tokens). | Presentación | **P1 (Alto)** |
| **RF-08** | Servidor WebSocket local para emitir métricas concurrentemente a React y Flutter. | Infraestructura | **P1 (Alto)** |
| **RF-09** | Detección y agregación automática de tokens consumidos por subagentes en paralelo. | Aplicación | **P1 (Alto)** |
| **RF-10** | Almacenamiento local en SQLite del histórico de tokens por sesión para gráficas de tendencia. | Infraestructura | **P2 (Medio)** |

---

## 9. Plan de Pruebas y Criterios de Aceptación (Definition of Done)

1. **Pruebas Unitarias (Domain Layer):** Cobertura $\ge 95\%$ en validaciones de `GranularTokenCount`, cálculo de `CurrencyCost` y transiciones de estado de `TokenSessionAggregate`.
2. **Pruebas de Integración (Infrastructure Layer):** Simulación de flujo de escritura en caliente sobre archivos `transcript.jsonl` falsos verificando que ningún evento de token se pierda bajo estrés (100 escrituras/segundo).
3. **Pruebas de Rendimiento Visual (Presentation Layer):**
   - Verificar que al arrastrar la tarjeta con `motion/react`, el uso de GPU se mantenga dentro de los límites y no existan caídas de frames (no jank).
   - Comprobar que en Flutter el `CustomPainter` libere memoria adecuadamente al destruirse el widget.

---

## 10. Desglose Detallado de Fases de Ingeniería y Checklist de Seguimiento

Este roadmap divide la implementación en fases secuenciales y modulares para garantizar que cada entrega sea testeable, segura y alineada con las reglas del proyecto.

### 📊 Estado General del Proyecto: `FASE 0 COMPLETADA (100%) | FASE 1 LISTA PARA INICIAR`

---

### [FASE 0] — Cimientos, Especificación y Marco Normativo
> **Objetivo:** Definición de arquitectura DDD, especificaciones de diseño Liquid Glass, contratos de datos y marco normativo estricto.

- [x] **0.1** Redacción y refinamiento del **Product Requirements Document (PRD v2.0.0 Master Blueprint)** en `PRD.md`.
- [x] **0.2** Adopción estricta de **`pnpm`** como gestor de paquetes exclusivo del monorepo, prohibiendo `npm`, `yarn` y `bun`.
- [x] **0.3** Adaptación integral de las **15 reglas de ingeniería** en `/rules` alineadas con el dominio de tokens y gobernanza de Kevin.
- [x] **0.4** Definición de la política de seguridad **Zero-Leakage** (procesamiento 100% on-device sin fuga de código ni prompts).
- [x] **0.5** Especificación matemática y física de la superficie fluida senoidal y refracción SVG (`feTurbulence` / `feDisplacementMap`).
- [x] **0.6** Integración del componente primitivo de diseño atómico `LiquidGlassCard` en `@/components/ui/liquid-weather-glass.tsx`.
- [x] **0.7** Creación de la utilidad estándar de clases `cn` con `clsx` y `tailwind-merge` en `@/lib/utils.ts`.
- [x] **0.8** Prototipado del componente de dominio de tokens `TokenLiquidCard` en `@/components/features/TokenLiquidCard.tsx`.

---

### [FASE 1] — Estructura Monorepo `pnpm workspaces` y Núcleo de Dominio DDD
> **Objetivo:** Inicializar la arquitectura multi-paquete, configurar Turborepo y construir la capa pura de dominio independiente de frameworks.

- [ ] **1.1** Crear la configuración raíz del monorepo: `pnpm-workspace.yaml`, `.npmrc` (aislamiento estricto) y `turbo.json`.
- [ ] **1.2** Configurar `package.json` raíz con scripts orquestadores (`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`).
- [ ] **1.3** Crear el paquete compartido `packages/domain-core` con TypeScript estricto.
- [ ] **1.4** Implementar los **Value Objects** inmutables del dominio:
  - `GranularTokenCount` (validaciones de no negatividad, total activo vs facturable).
  - `FillLevel` (cálculo de 0.0 a 1.0 y máquina de estados: `safe`, `warning`, `critical`).
  - `CurrencyCost` (tarifario oficial de Gemini 2.5 Pro y Flash por millón de tokens).
  - `RateLimitWindow` (cálculo de tiempo de reseteo para TPM/RPM).
- [ ] **1.5** Implementar el **Agregado Raíz** `TokenSessionAggregate` con sus invariantes y eventos de dominio (`TokenBatchConsumedEvent`, `QuotaThresholdCrossedEvent`).
- [ ] **1.6** Definir las interfaces de puertos: `ITokenTelemetryRepository`, `IQuotaProviderService`, `IMetricLogRepository`.
- [ ] **1.7** Crear la suite de pruebas unitarias en `packages/domain-core` con Vitest (cobertura $\ge 95\%$).

---

### [FASE 2] — Ingesta Híbrida & Adaptadores de Infraestructura
> **Objetivo:** Construir el lector de logs locales de Antigravity y el conector de cuotas con Google AI Studio.

- [ ] **2.1** Crear la aplicación backend en `apps/server` con TypeScript y Node.js / Fastify.
- [ ] **2.2** Implementar el validador de seguridad de rutas `validarRutaLogs()` con resolución `fs.realpath` para blindar `ANTIGRAVITY_LOGS_ROOT`.
- [ ] **2.3** Implementar el adaptador de observación de archivos `AntigravityTranscriptWatcherAdapter` con Chokidar / `fs.watch` (debouncing de 35ms).
- [ ] **2.4** Diseñar el parser resiliente de `transcript.jsonl` capaz de procesar líneas JSON incrementales, campos truncados y subagentes concurrentes.
- [ ] **2.5** Implementar el cliente oficial `GeminiApiClientAdapter` para consultar límites oficiales y saldo de cuota vía API Key de Google AI Studio.
- [ ] **2.6** Integrar el adaptador híbrido `HybridTokenTelemetryAdapter` que consolida logs locales + cuota cloud.
- [ ] **2.7** Pruebas de integración con fixtures reales de logs simulando 100 escrituras concurrentes por segundo.

---

### [FASE 3] — Servidor de Streaming Reactivo WebSocket / SSE
> **Objetivo:** Distribuir eventos de tokens en tiempo real a clientes Web y Mobile con latencia sub-50ms.

- [ ] **3.1** Configurar el servidor Fastify / Express con soporte de WebSockets (`@fastify/websocket` o `ws`).
- [ ] **3.2** Implementar el middleware de seguridad LAN: exigir `TOKEN_LENS_API_TOKEN` si `BIND_HOST` no es loopback.
- [ ] **3.3** Implementar el pipeline de serialización bajo el contrato `TokenTelemetryStreamPacket`.
- [ ] **3.4** Implementar canal de broadcast pub/sub para notificar deltas de tokens y cambios de sesión en caliente.
- [ ] **3.5** Exponer endpoints REST bajo el envelope `{ "exito": true, "mensaje": "...", "datos": {}, "meta": {} }`:
  - `GET /api/v1/sesiones/activa`: Estado actual y métricas acumuladas.
  - `GET /api/v1/cuotas`: Límites TPM/RPM y reseteo.
  - `GET /health`: Sonda operativa de salud (`{ "status": "ok" }`).
- [ ] **3.6** Pruebas de carga y latencia del servidor de streaming.

---

### [FASE 4] — Frontend Web React 19 Liquid Glass (`apps/web`)
> **Objetivo:** Montar la interfaz de usuario web completa con estética premium de cristal líquido, interacción táctil y reactividad.

- [ ] **4.1** Inicializar `apps/web` con Vite + React 19 + TypeScript + Tailwind CSS 4 usando `pnpm`.
- [ ] **4.2** Configurar shadcn/ui y vincular la librería de animaciones `motion/react`.
- [ ] **4.3** Migrar e integrar [liquid-weather-glass.tsx](file:///c:/Users/kevin.austria/proyectos/detector%20de%20tokens/components/ui/liquid-weather-glass.tsx) y [TokenLiquidCard.tsx](file:///c:/Users/kevin.austria/proyectos/detector%20de%20tokens/components/features/TokenLiquidCard.tsx) dentro de `apps/web/src/`.
- [ ] **4.4** Implementar el hook de aplicación `useTokenStream` para conectar el cliente WebSocket y sincronizar deltas de tokens en tiempo real.
- [ ] **4.5** Implementar el cliente HTTP único `HttpTokenApi` para peticiones REST de configuración y cuotas.
- [ ] **4.6** Desarrollar componentes complementarios:
  - `HeaderStatusBar`: Indicador de latencia, modelo seleccionado y estado de conexión WebSocket.
  - `GranularBreakdownPanel`: Gráficos interactivos de Prompt vs Output vs Cached vs Thinking tokens.
  - `RateLimitMeter`: Tacómetro de velocidad para TPM / RPM.
  - `FinancialEstimatorBadge`: Contador animado de costo acumulado en USD ($).
- [ ] **4.7** Implementar el modo HUD flotante arrastrable con límites elásticos y persistencia de posición en pantalla.
- [ ] **4.8** Pruebas de accesibilidad (teclado, ARIA, foco visible) y auditoría de rendimiento a 60–120 FPS.

---

### [FASE 5] — Cliente Multiplataforma Flutter Desktop / Mobile (`apps/mobile_desktop`)
> **Objetivo:** Desarrollar la aplicación nativa en Flutter con renderizado Impeller y shader líquido matemático.

- [ ] **5.1** Inicializar el proyecto Flutter en `apps/mobile_desktop` configurado para Desktop (Windows, macOS, Linux) y Mobile (Android/iOS).
- [ ] **5.2** Implementar el modelo de dominio en Dart espejo de `packages/domain-core`.
- [ ] **5.3** Desarrollar el `CustomPainter` matemático `LiquidWavePainter` con cálculo senoidal de ondas y oleaje reactivo.
- [ ] **5.4** Implementar la tarjeta de cristal translúcido con `BackdropFilter` y bordes de luz cáustica.
- [ ] **5.5** Configurar BLoC / Cubit para gestionar el flujo de eventos WebSocket entrantes.
- [ ] **5.6** Soporte para modo Picture-in-Picture (PiP) / Ventana siempre visible (Always on Top) para Windows.

---

### [FASE 6] — Auditoría de Seguridad, DevSecOps y Publicación
> **Objetivo:** Garantizar la integridad de la cadena de suministro, pruebas E2E y validación final por parte de Kevin.

- [ ] **6.1** Configuración de `.github/workflows/ci.yml` ejecutando `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm test` → `pnpm build`.
- [ ] **6.2** Auditoría de seguridad de dependencias con `pnpm audit` y revisión estricta de licencias.
- [ ] **6.3** Verificación de cumplimiento de la política **Zero-Leakage** (pruebas de penetración y fuga de logs).
- [ ] **6.4** Configuración de `docker-compose.yml` para despliegue contenerizado local seguro.
- [ ] **6.5** Revisión del checklist de calidad visual ([rules/08-checklist-revision-diseno.mdc](file:///c:/Users/kevin.austria/proyectos/detector%20de%20tokens/rules/08-checklist-revision-diseno.mdc)).
- [ ] **6.6** Presentación formal a **Kevin** para aprobación y validación explícita antes de cualquier commit o publicación remota.

