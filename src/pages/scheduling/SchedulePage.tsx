import { ScheduleGrid } from '../../components/schedule/ScheduleGrid';

/**
 * SchedulePage — wrapper alrededor del ScheduleGrid existente. La grid
 * sigue dependiendo de Zustand + REST + Socket.IO (no la rehicimos en
 * F.3.2; el refactor del grid en sí queda fuera de scope).
 */
export const SchedulePage = () => (
  <div className="space-y-4 h-full">
    <header>
      <h1 className="text-xl font-bold text-foreground">Horario semanal</h1>
      <p className="text-sm text-muted-foreground">
        Vista interactiva del horario actual del tenant.
      </p>
    </header>
    <ScheduleGrid />
  </div>
);
