---
description: Frontend Agent Instructions for AI Workflow Scheduling SaaS
---

# Global Instructions

This project is the frontend for Scenario 6 (AI Workforce Scheduling SaaS).
It is a React application built with Vite and TypeScript.

## Core Technologies
- **Framework**: React 18+ via Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS, Shadcn UI components
- **State Management**:
  - `zustand` for local/client state (e.g., UI toggles, temporary edited shifts).
  - `@tanstack/react-query` for server state (fetching schedules, coverage stats, caching).
- **Icons**: `lucide-react`
- **Charts**: `recharts` for Fairness and Dashboard analytics.

## Folder Structure
- `src/components/`: Reusable UI components (Shadcn UI goes in `src/components/ui/`).
- `src/components/widgets/`: High-level dashboard widgets (CoverageAlertWidget, ScheduleStatusWidget, etc).
- `src/layout/`: Page layouts (e.g., DashboardLayout).
- `src/api/`: Data fetching hooks and React Query mutations.
- `src/store/`: Zustand stores.

## Architectural Rules
1. **Never mutate server state directly**: Always use React Query mutations to update backend data, and rely on query invalidation for UI updates.
2. **Local Overrides**: For the visual schedule editor, optimistic updates should be stored in Zustand until confirmed and flushed to the backend.
3. **Styling Best Practices**: Use Tailwind utility classes directly in `className`. For dynamic classes or variations, use `clsx` and `tailwind-merge` combined with `class-variance-authority` (`cva`).
4. **Agent Mentality**: Be proactive in writing clean, typed interfaces for API models and component props. Never guess the structure, define types in `src/types/`.
