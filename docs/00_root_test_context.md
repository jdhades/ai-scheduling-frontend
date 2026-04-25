# ROOT TEST CONTEXT — ai-scheduling-frontend

> Documento de referencia obligatorio para cualquier sesión que vaya a
> generar, correr o reparar tests. Cargar antes de cualquier acción.
>
> Generado: 2026-04-25 · Strict mode: ON · Repo: `ai-scheduling-frontend`

---

## 1. Architecture

**Stack**
- Vite **7.3.1** + React **19.2.0** + TypeScript **5.9.3** + Tailwind **4.2.1**
- React Router DOM **7.14.2** (`createBrowserRouter`, sin lazy loading)
- Zustand **5.0.11** (estado de UI)
- React Query **5.90.21** + axios **1.13.6** (data fetching)
- Vitest **4.0.18** + @testing-library/react **16.3.2** + jsdom (testing)
- Socket.io-client **4.8.3** (realtime)
- Motion **12.38.0** + Recharts **3.8.0** + Lucide-react + Radix UI

**Routing** ([src/router.tsx](../src/router.tsx))
- `/` → `AppLayout` → `DashboardPage` (índice)
- `/workforce/{employees,memberships,skills}` (placeholders)
- `/scheduling/{templates,grid,generate}` (placeholders)
- `/rules`, `/approvals/{incidents,swaps,absences,day-offs}`, `/insights/{fairness,coverage,demand}` (placeholders)
- Catch-all `*` redirige a `/`
- Layout pattern: `AppLayout` envuelve sidebar + header + `<Outlet />`

**Estado (Zustand)**
- [src/store/dashboardStore.ts](../src/store/dashboardStore.ts) →
  `{ sidebarCollapsed, activeView, toggleSidebar, setSidebarCollapsed, setActiveView }`
- [src/store/scheduleStore.ts](../src/store/scheduleStore.ts) →
  `{ employees[], shifts[], incidents[], addShift, updateShift, removeShift, addIncident, removeIncident, setShifts, setEmployees, loadMockData() }`

**Fetching**
- [src/lib/api.ts](../src/lib/api.ts): instancia axios compartida con
  `baseURL` desde `VITE_API_URL`, header `X-Company-Id` y query param
  `companyId` inyectados automáticamente.
- API hooks por entidad en `src/api/*.ts`.
- ⚠️ Algunos archivos (`schedule.api.ts`, `shift-templates.api.ts`) aún
  hardcodean `API_URL = 'http://localhost:3000'` en lugar de usar la
  instancia compartida — drift por refactorizar.

**WebSocket** ([src/lib/SocketContext.tsx](../src/lib/SocketContext.tsx))
- Conecta a `http://localhost:3000`, transports `[websocket, polling]`.
- Listeners: `ScheduleGenerated` (invalida queries de schedules),
  `IncidentCreated` (push a Zustand `addIncident`).

**i18n** ([src/lib/i18n.ts](../src/lib/i18n.ts))
- i18next + auto language detector. Idiomas: `en` (fallback), `es`.
- Namespaces: `app`, `nav`, `scheduleGrid`, `widgets`, `heatmap`, `fairness`.

---

## 2. Modules and dependencies

**Páginas** (`src/pages/`)
| Path | Archivo | Propósito |
|---|---|---|
| `/` | `DashboardPage.tsx` | Bento grid con 7 widgets, alimentado por `useDashboardData` (mock) |
| (genérico) | `Placeholder.tsx` | Stub para rutas sin UI todavía |

**Componentes** (26 archivos, agrupados)
- `ui/` — primitivos shadcn-like: `button`, `input`, `label`, `textarea`, `dialog`, `table`, `Badge`, `Card`
- `layout/` — `DashboardHeader`, `BentoGrid` (+ `BentoItem`), `Sidebar` (legacy), `AppSidebar` (nuevo grupos colapsables)
- `widgets/` — `MetricCardWidget`, `AIInsightsWidget`, `FairnessGaugeWidget`, `CoreOrchestratorWidget`, `NodeInsightsWidget`, `SchedulingActivityWidget`, `InitialWidgets` (`ScheduleStatusWidget`, `CoverageAlertWidget`)
- `schedule/` — `ScheduleGrid`, `EmployeeRow` (memo), `ShiftCell` (memo), `ShiftTemplatesPanel`
- `heatmap/` — `CoverageHeatmap` (7×12 interactivo), `HistoricalDemandHeatmap`
- `fairness/` — `FairnessPanel` (BarChart + RadarChart de Recharts)

**Hooks/Services**
- `src/api/dashboard.api.ts` → `useDashboardData()` (mock con setTimeout)
- `src/api/schedule.api.ts` → `useEmployeesQuery`, `useScheduleQuery`, `useGenerateScheduleMutation`, `useGenerateHybridMutation`
- `src/api/shift-templates.api.ts` → `useShiftTemplatesQuery`, `useCreateTemplateMutation`, `useDeleteTemplateMutation`, `useInstantiateWeekMutation`
- `src/lib/SocketContext.tsx` → `useSocket()`
- `src/lib/coverage.ts` → `calculateCoverageScore`, `getCoverageColorClass`
- `src/lib/utils.ts` → `cn()`

**Stores** (ver §1).

---

## 3. UI components

| Componente | Props clave | Estado interno | Test |
|---|---|---|---|
| **ShiftCell** | `employeeName, role, status, onDelete?` | memo puro | ✅ (vía ScheduleGrid) |
| **EmployeeRow** | `employee, hours[]` | memo puro | ✅ |
| **ScheduleGrid** | — | usa hooks: `useEmployeesQuery`, `useScheduleQuery`, setters Zustand | ✅ render-only |
| **CoverageHeatmap** | — | `selectedCell, showDetails` | ✅ render + click |
| **HistoricalDemandHeatmap** | — | puro (mock) | ✅ render |
| **FairnessPanel** | — | puro, mock recharts | ✅ |
| **MetricCardWidget** | `metric, className?` | motion.div (animate) | ❌ |
| **AIInsightsWidget** | `insights` | puro | ❌ |
| **FairnessGaugeWidget** | `value, className?` | puro | ❌ |
| **CoreOrchestratorWidget** | `load, activeNodes` | puro | ❌ |
| **NodeInsightsWidget** | — | puro | ❌ |
| **SchedulingActivityWidget** | `activities` | puro | ❌ |
| **InitialWidgets** | — | `CoverageAlertWidget` lee `useScheduleStore` | ✅ parcial |
| **BentoGrid / BentoItem** | `children, colSpan, rowSpan, className?` | puro | ❌ |
| **DashboardHeader / Sidebar / AppSidebar** | varios | puro | ❌ |
| **Button / Input / Label / Textarea / Dialog / Table** | Radix wrappers | puros | ❌ (ui kit, prioridad baja) |
| **Badge / Card** | `children, className` | puros | ❌ |

---

## 4. API flows

**Endpoints consumidos hoy**
| Verbo | URL | Hook | Invalidación |
|---|---|---|---|
| GET | `/employees` | `useEmployeesQuery` | — |
| GET | `/schedules` | `useScheduleQuery` | — |
| POST | `/schedules/generate` | `useGenerateScheduleMutation` | `['schedules', companyId, weekStart]` |
| POST | `/schedules/generate/hybrid` | `useGenerateHybridMutation` | `['schedules', companyId, weekStart]` |
| GET | `/shift-templates` | `useShiftTemplatesQuery` | — |
| POST | `/shift-templates` | `useCreateTemplateMutation` | `['shift-templates', companyId]` |
| DELETE | `/shift-templates/:id` | `useDeleteTemplateMutation` | `['shift-templates', companyId]` |
| POST | `/shift-templates/instantiate` | `useInstantiateWeekMutation` | `['schedules']` (overbroad) |

**Manejo de errores**: prácticamente nulo — sin toasts, sin error boundaries, sin estados visibles. `DashboardPage` chequea `isError` pero no muestra nada accionable.

**Gaps CRUD frontend ↔ backend** (orchestrator ya tiene los endpoints; falta el cliente)
- ❌ `shift-memberships` (GET/POST/DELETE)
- ❌ `company-skills` (GET/POST/DELETE)
- ❌ `semantic-rules` (GET/POST/PATCH metadata/PATCH text/DELETE)
- ❌ `incidents` (GET list/get-id/POST/POST reject/POST resolve)
- ❌ `shift-swap-requests` (GET/POST/POST approve/POST reject)
- ❌ `absence-reports` (GET/POST)
- ❌ `day-off-requests` (GET/POST/POST approve/POST reject)
- ❌ `working-time-policy` (GET resolved per employee)
- ❌ `fairness-history` (GET por semana / por empleado)
- ❌ Employee CRUD completo (hoy solo list — falta get-one/PATCH/DELETE)
- ❌ ShiftTemplate get-one/PATCH

---

## 5. Known bugs

`grep TODO|FIXME|HACK src/` → **0 resultados** (ningún comentario explícito de deuda).

Hallazgos implícitos (deuda no marcada):
- **[src/api/schedule.api.ts](../src/api/schedule.api.ts) y [src/api/shift-templates.api.ts](../src/api/shift-templates.api.ts)** — duplican `API_URL` hardcodeado en lugar de usar `src/lib/api.ts`. Refactor obvio.
- **[src/api/dashboard.api.ts](../src/api/dashboard.api.ts)** — datos mock con `setTimeout(1000)`; no consume backend real.
- **[src/components/heatmap/CoverageHeatmap.test.tsx](../src/components/heatmap/CoverageHeatmap.test.tsx)** — el click en celda usa selector `.group\/cell` (CSS class), frágil ante cambios de styling.
- Mezcla de **`Sidebar` (legacy)** y **`AppSidebar` (nuevo)** — uno de los dos está muerto; verificar que el legacy no sea importado en ningún lado.

---

## 6. Existing tests

**Setup**
- `vite.config.ts` define `test: { environment: 'jsdom', globals: true }`.
- **Sin** `vitest.setup.ts` — cada test mocka i18next/Recharts inline.
- **Sin** MSW — toda llamada HTTP de un test debería estar mockeada (no se hace hoy).

**Inventario** (9 archivos)
| Archivo | Cubre | Estado |
|---|---|---|
| `src/App.test.tsx` | render header + widgets iniciales | ✅ smoke |
| `src/lib/coverage.test.ts` | `calculateCoverageScore` (4 casos) + `getCoverageColorClass` (6 casos) | ✅ unit puro |
| `src/components/schedule/ScheduleGrid.test.tsx` | render con dummy data, ShiftCell por status | ✅ render+rerender |
| `src/components/schedule/__tests__/EmployeeRow.test.tsx` | skills match (assigned) vs no-match (conflict) | ✅ |
| `src/components/schedule/__tests__/ScheduleGridBenchmark.test.tsx` | render 200 emp × 400 shifts <1500ms | ✅ perf |
| `src/components/heatmap/CoverageHeatmap.test.tsx` | render días + click cell → details | ✅ frágil |
| `src/components/heatmap/__tests__/HistoricalDemandHeatmap.test.tsx` | render grid + dots | ✅ smoke |
| `src/components/widgets/__tests__/InitialWidgets.test.tsx` | CoverageAlertWidget vacío vs con incidents | ✅ |
| `src/components/fairness/__tests__/FairnessPanel.test.tsx` | render + mocks Recharts | ✅ |

⚠️ Pre-existente: `EmployeeRow.test.tsx` y `MetricCardWidget.tsx` rompen `tsc --noEmit`. `npm run build` (`tsc -b && vite build`) falla por estos errores. `vite build` directo SÍ funciona.

---

## 7. Testing gaps

**🔴 Crítico — sin test alguno**
- **Todos los hooks de `src/api/*`** (10 hooks) — sin unit tests, sin mocks de axios, sin tests de invalidación de queries, sin tests de error.
- **`src/lib/SocketContext.tsx`** — conexión, eventos, reconnect, cleanup.
- **`src/router.tsx`** — Navigate redirects, catch-all, rutas anidadas.
- **`src/lib/api.ts`** — interceptor de companyId, header X-Company-Id.

**🟡 Medio — componentes huérfanos**
- 6 widgets sin test: `MetricCardWidget`, `AIInsightsWidget`, `FairnessGaugeWidget`, `CoreOrchestratorWidget`, `NodeInsightsWidget`, `SchedulingActivityWidget`.
- Layout: `BentoGrid`, `BentoItem`, `AppSidebar`, `DashboardHeader`.
- Pages: `DashboardPage`, `Placeholder`, `AppLayout`.
- Stores: ningún test directo de actions de Zustand (solo uso indirecto en tests de componentes).

**🟢 Bajo — refactor**
- Tests parciales (solo render): `ScheduleGrid`, `HistoricalDemandHeatmap` (faltan interacciones, mutations).
- `CoverageHeatmap` — selector frágil (`.group\/cell`); cambiarlo por `data-testid`.
- UI kit (Button/Input/Label/Dialog/Table/Badge/Card) — son wrappers Radix; tests de regresión visual con Storybook serían más útiles que unit.

**Sugerencias por nivel**
1. **Unit** — agregar pure tests para todas las API hooks con `axios-mock-adapter` o MSW (mejor MSW para integración real).
2. **Component** — para widgets mockear React Query con `wrapper={QueryClientProvider}` + `MemoryRouter`. Usar `data-testid` consistente.
3. **Integration** (con MSW): flujo completo `DashboardPage` → render → fetch → asserts; `ScheduleGrid` → fetch + Zustand sync; SocketContext → emit + verificar invalidación.
4. **E2E** (Playwright recomendado): dashboard → navigate workforce → ver lista → crear empleado → schedule grid → generar; coverage heatmap → click → modal; socket-driven update post-generación.

**Convenciones a adoptar**
- `data-testid` en lugar de selectores CSS para todos los nuevos tests.
- `vitest.setup.ts` central con mocks comunes (i18n, Recharts).
- MSW server compartido en `src/test/msw/` para integración.
- Wrapper helper `renderWithProviders` con `QueryClient`, `MemoryRouter`, `SocketContext` mock.
