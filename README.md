# AI Scheduling — Frontend

Manager-facing SPA for the **AI Scheduling Orchestrator** product: a panel to manage employees, shifts, policies, semantic rules, absences and incidents, and to generate / approve schedules with AI assistance.

> **Stack:** Vite 7 · React 19 · TypeScript 5.9 · TailwindCSS 4 · Shadcn UI · TanStack Query · TanStack Table · i18next (EN/ES) · Recharts · React Router 7

> **NOT Next.js**. It is a pure SPA served by Vite. If you open this repo from another assistant and read "Next.js" anywhere, that's stale.

---

## What it solves

The backend (`ai-scheduling-orchestrator`, NestJS + Supabase + Twilio + a configurable LLM provider) implements the domain: employees, shift templates, an LLM-authoritative scheduling engine with verify-loop, semantic rules with pgvector, company policies with interpreter accelerators, OCR-powered incident reports, and shift swaps over WhatsApp.

This frontend is the manager-facing surface:

- **Workforce** — employees (with per-person working-time policy), skills, memberships, skill assignment to templates.
- **Scheduling** — templates, schedule generation, fairness view, approval.
- **Rules** — semantic rules in natural language (per-shift RAG).
- **Policies** — company policies with severity (`hard`/`soft`); supports the *suggestion-loop* flow when the system can't structure the text.
- **Operations** — absences, incidents, swaps, day-offs (all rendered with `<DataTable>` + filters + pagination).
- **Insights** — placeholders for coverage / demand heatmaps.

---

## Run locally

```bash
npm install
npm run dev          # Vite dev server (HMR)
npm run build        # tsc -b && vite build
npm run preview      # preview the build
npm run lint         # eslint
```

The dev server defaults to Vite's port (5173). The backend expects an `X-Company-Id` header (a known HIGH-priority debt — see `ai-scheduling-orchestrator/.agents/SECURITY-ARCHITECTURE.md`).

### Relevant variables

Create `.env.local` (gitignored) at the root:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_DEFAULT_COMPANY_ID=<your-dev-tenant-uuid>
```

`.env.example` (in the repo) lists every variable with empty values.

---

## Project conventions

### Tables and lists
**Single standard: `<DataTable>` (TanStack Table).** Search, sortable headers, filters (role / state), pagination with a page-size selector (5/10/15/20, default 10). Applied to Skills, Memberships, Rules, Templates, Fairness, Absences, Incidents, Swaps, Day-offs, Employees.

Documented exception: the **schedule grid** (it isn't a list — it's a 2D grid of slots).

### Design
Before touching UI: read [docs/design-system.md](docs/design-system.md) — tokens, layout, mandatory states (loading / empty / error), touch targets, accessibility, anti-patterns.

Before declaring a UI task done: run [/preflight-ui](.claude/commands/preflight-ui.md). If the checklist still has TODOs, the task isn't closed.

If a design-system rule falls short for a real case, update the doc in the same PR. No silent improvisation.

### Error messages
Never display raw Postgres text or `Internal Server Error`. The backend returns a stable `errorCode` (via `PostgresExceptionFilter`); the frontend resolves it through `describeApiError(...)` and i18n (EN/ES).

Codes supported today: `unique_violation`, `foreign_key_violation`, `not_null_violation`, `invalid_input`, `value_too_long`. Adding a new one is a coordinated change: backend maps it + frontend adds the translation.

### i18n
EN + ES via `i18next` + `react-i18next`. `<LanguageSwitcher>` lives in the global header.

- **Default language is English.** The detector intentionally OMITS `navigator`, so the app does not flip to Spanish just because the browser locale happens to be `es-AR`. Users land on EN and stay there until they toggle, which persists their choice in localStorage.
- **Per-namespace JSON.** Resources live in [`src/locales/{en,es}/<namespace>.json`](src/locales). Namespaces in use: `common`, `errors`, `nav`, `legacy`, `policies`, `templates`, `workforce`, `scheduling`, `rules`, `dashboard`.
- **Key syntax:** `t('namespace:path.to.key')`. Use `<Trans i18nKey="…">` for inline markup.

### State management
- **Server state**: TanStack Query (lists, mutations, invalidation).
- **Client state**: component state, or Zustand if it crosses routes. Don't reach for Zustand "just in case".
- **WebSockets** (planned): a direct bridge into the TanStack Query cache for `ScheduleGenerated`, `IncidentCreated`, etc.

### No hardcoding (project rule)
Don't introduce keywords, magic numbers, domain-specific text patterns or business data without explicit approval. If there's no viable alternative, mark the spot with:

```ts
// TODO(hardcode): <what is hardcoded> — <why> — <how to remove it later>
```

Greppable with `grep -r "TODO(hardcode)"`.

---

## Layout

```
src/
  api/           — axios clients + types shared with the backend
  components/    — shadcn primitives + reusable components (DataTable, LanguageSwitcher, …)
  layout/        — chrome (sidebar, header)
  layouts/       — section layouts
  lib/           — utilities (describeApiError, formatters, …)
  locales/       — i18n resources, per-namespace JSON files (en/, es/)
  pages/
    approvals/   — schedule approvals
    insights/    — heatmaps (placeholders)
    policies/    — CompanyPoliciesPage + CompanyPolicyFormDialog
    rules/       — semantic rules (CRUD)
    scheduling/  — templates, generation, schedule view
    workforce/   — employees, skills, memberships, working-time policy
  store/         — Zustand
  test/          — testing-library + msw setup
  types/         — shared types
  router.tsx     — React Router 7
  main.tsx       — entry
```

---

## Cross-repo context (also worth reading)

If you're touching features that have a backend counterpart, read the orchestrator docs:

- `ai-scheduling-orchestrator/.agents/SYSTEM-MAP.md` — global map (frontend + backend).
- `ai-scheduling-orchestrator/.agents/EVENT-FLOWS.md` — FLOW 6 (web policy creation with suggestion-loop), FLOW 7/8 (creation via WhatsApp).
- `ai-scheduling-orchestrator/.agents/COMPANY-POLICIES.md` — open + interpreter-accelerators subsystem (multi-tenant, NOT a closed enum).
- `ai-scheduling-orchestrator/.agents/SECURITY-ARCHITECTURE.md` — DEV_AUTH_BYPASS, CORS, ValidationPipe, error mapping, open debt.

---

## Testing

- Vitest + Testing Library + MSW for API mocks.
- `npm run test` (when wired up in `package.json` — currently invoked directly via `vitest`).
- Each DataTable-backed screen has specs for search, sort, filter and pagination.

---

## Known debt (do not touch without coordinating)

- **`X-Company-Id` via header** without JWT — aligned with the backend's `DEV_AUTH_BYPASS`. Migrating to JWT is its own item; it doesn't ride along with feature work.
- **Heatmaps** are still placeholders under `insights/`.
- **WebSockets** are not connected yet; lists invalidate via polling/mutation.

---

## Useful commands

```bash
# start the dev server
npm run dev

# run the UI preflight before closing a task
# (defined in .claude/commands/preflight-ui.md)

# typecheck without emit
npx tsc -b --noEmit
```
