# AI Scheduling — Frontend

Manager-facing SPA del producto **AI Scheduling Orchestrator**: panel para gestionar empleados, turnos, políticas, reglas semánticas, ausencias e incidencias, y generar/aprobar schedules con asistencia de IA.

> **Stack:** Vite 7 · React 19 · TypeScript 5.9 · TailwindCSS 4 · Shadcn UI · TanStack Query · TanStack Table · i18next (EN/ES) · Recharts · React Router 7

> **NOT Next.js**. Es una SPA pura servida por Vite. Si abrís este repo desde otro asistente y leés "Next.js" en algún lado, está stale.

---

## ¿Qué resuelve?

El backend (`ai-scheduling-orchestrator`, NestJS + Supabase + Twilio + LLM provider configurable) implementa el dominio: empleados, templates de turno, motor de scheduling con LLM autoritario + verify-loop, reglas semánticas con pgvector, políticas de empresa con interpreter accelerators, incidencias con OCR, swap de turnos vía WhatsApp.

Este frontend es la cara visible para managers:

- **Workforce** — empleados (con working-time policy individual), skills, memberships, asignación de skill a templates.
- **Scheduling** — templates, generación de schedules, vista de fairness, aprobación.
- **Rules** — reglas semánticas en lenguaje natural (RAG por turno).
- **Policies** — políticas de empresa con severity (`hard`/`soft`); soporta el flujo *suggestion-loop* cuando el sistema no puede estructurar el texto.
- **Operations** — absences, incidents, swaps, day-offs (todos con `<DataTable>` + filtros + paginación).
- **Insights** — placeholders para heatmaps de cobertura/demanda.

---

## Cómo correr local

```bash
npm install
npm run dev          # Vite dev server (HMR)
npm run build        # tsc -b && vite build
npm run preview      # preview de build
npm run lint         # eslint
```

El dev server por defecto usa el puerto de Vite (5173). El backend espera `X-Company-Id` por header (deuda HIGH conocida — ver `ai-scheduling-orchestrator/.agents/SECURITY-ARCHITECTURE.md`).

### Variables relevantes

Crear `.env.local` (ignorado por git) en la raíz:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_DEFAULT_COMPANY_ID=<uuid-de-tu-tenant-de-dev>
```

`.env.example` (en el repo) tiene la lista completa con valores vacíos.

---

## Convenciones del proyecto

### Tablas y listados
**Estándar único: `<DataTable>` (TanStack Table).** Search, sortable headers, filtros (rol/estado), paginación con page-size selector (5/10/15/20, default 10). Aplicado a Skills, Memberships, Rules, Templates, Fairness, Absences, Incidents, Swaps, DayOffs, Employees.

Excepción documentada: la **grilla de horarios** (no es una lista, es un grid 2D de slots).

### Diseño
Antes de tocar UI: leer [docs/design-system.md](docs/design-system.md) — tokens, layout, estados obligatorios (loading/empty/error), touch targets, accesibilidad, anti-patterns.

Antes de declarar una tarea de UI terminada: correr [/preflight-ui](.claude/commands/preflight-ui.md). Si el checklist tiene TODOs, la tarea no está cerrada.

Si una regla del design-system se queda corta para un caso real, actualizar el doc en el mismo PR. Sin improvisación silenciosa.

### Mensajes de error
Nunca mostrar texto crudo de Postgres ni `Internal Server Error`. El backend devuelve `errorCode` estable (vía `PostgresExceptionFilter`); el frontend lo resuelve con `describeApiError(...)` y i18n (EN/ES).

Códigos soportados hoy: `unique_violation`, `foreign_key_violation`, `not_null_violation`, `invalid_input`, `value_too_long`. Agregar uno nuevo es cambio coordinado: backend mappea + frontend agrega traducción.

### i18n
EN + ES via `i18next` + `react-i18next`. `<LanguageSwitcher>` en el header global. Las claves son flat y topic-scoped (`errors.unique_violation`, `policies.severity.hard`, …).

### State management
- **Server state**: TanStack Query (lists, mutations, invalidation).
- **Client state**: estado de componente o, si cruza rutas, Zustand. No usar Zustand "por las dudas".
- **WebSockets** (planeado): bridge directo a la cache de TanStack Query para `ScheduleGenerated`, `IncidentCreated`, etc.

### No hardcodear (regla del proyecto)
No introducir keywords, magic numbers, patterns de texto específicos del dominio o data del negocio sin aprobación explícita. Si no hay alternativa viable, marcar el lugar con:

```ts
// TODO(hardcode): <qué se hardcodea> — <por qué> — <cómo sacarlo después>
```

Buscables con `grep -r "TODO(hardcode)"`.

---

## Estructura

```
src/
  api/           — clientes axios + tipos compartidos con backend
  components/    — shadcn primitives + componentes reusables (DataTable, LanguageSwitcher, …)
  layout/        — chrome (sidebar, header)
  layouts/       — layouts por sección
  lib/           — utilidades (describeApiError, formatters, …)
  pages/
    approvals/   — aprobar schedules
    insights/    — heatmaps (placeholders)
    policies/    — CompanyPoliciesPage + CompanyPolicyFormDialog
    rules/       — reglas semánticas (CRUD)
    scheduling/  — templates, generación, vista de schedule
    workforce/   — empleados, skills, memberships, working-time policy
  store/         — Zustand
  test/          — setup de testing-library + msw
  types/         — tipos compartidos
  router.tsx     — React Router 7
  main.tsx       — entry
```

---

## Contexto cruzado (leer también)

Si vas a tocar features que tienen contraparte en backend, leé los docs del orchestrator:

- `ai-scheduling-orchestrator/.agents/SYSTEM-MAP.md` — mapa global (frontend + backend).
- `ai-scheduling-orchestrator/.agents/EVENT-FLOWS.md` — FLOW 6 (creación web de policies con suggestion-loop), FLOW 7/8 (creación vía WhatsApp).
- `ai-scheduling-orchestrator/.agents/COMPANY-POLICIES.md` — subsistema open + interpreter accelerators (multi-tenant, NO closed enum).
- `ai-scheduling-orchestrator/.agents/SECURITY-ARCHITECTURE.md` — DEV_AUTH_BYPASS, CORS, ValidationPipe, error mapping, deuda abierta.

---

## Testing

- Vitest + Testing Library + MSW para mocks de API.
- `npm run test` (cuando esté en `package.json` — actualmente se corre vía `vitest` directamente).
- Cada pantalla con DataTable tiene specs de búsqueda, sort, filtro y paginación.

---

## Deuda conocida (no tocar sin coordinar)

- **`X-Company-Id` por header** sin JWT — alineado con `DEV_AUTH_BYPASS` del backend. Migrar a JWT es un ítem propio, no se mezcla con feature work.
- **Heatmaps** todavía son placeholders en `insights/`.
- **WebSockets** aún no conectados; las listas se invalidan vía polling/mutation.

---

## Comandos útiles

```bash
# levantar dev server
npm run dev

# correr preflight de UI antes de cerrar una tarea
# (definido en .claude/commands/preflight-ui.md)

# typechecking sin emit
npx tsc -b --noEmit
```
