import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScheduleGrid } from '../../components/schedule/ScheduleGrid';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useDepartmentsQuery } from '../../api/scope-targets.api';

/** Calcula el lunes de la semana actual (UTC, ISO YYYY-MM-DD). */
const upcomingMondayISO = (): string => {
  const d = new Date();
  const dow = d.getUTCDay();
  const daysUntilMonday = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  return d.toISOString().slice(0, 10);
};

/**
 * SchedulePage — visualización del horario semanal. Selector de semana
 * + filter opcional por departamento (smart-skip si solo hay 1 dept).
 *
 * El refactor del Grid en sí queda fuera de este sprint: sigue
 * dependiendo del store Zustand legacy + bridging del shape via
 * `useScheduleQuery`.
 */
export const SchedulePage = () => {
  const { t } = useTranslation();
  const [weekStart, setWeekStart] = useState<string>(upcomingMondayISO());
  const [departmentId, setDepartmentId] = useState<string>('');

  const departmentsQ = useDepartmentsQuery();
  const departments = departmentsQ.data ?? [];
  const showDeptSelector = departments.length > 1;
  const effectiveDeptId = showDeptSelector ? departmentId : '';

  return (
    <div className="space-y-4 h-full">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('scheduling:schedulePage.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('scheduling:schedulePage.subtitle')}
          </p>
        </div>
        <div className="flex gap-3 items-end">
          <div className="space-y-1">
            <Label htmlFor="sched-week" className="text-xs">
              {t('scheduling:schedulePage.weekLabel')}
            </Label>
            <Input
              id="sched-week"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              data-testid="sched-week-input"
              className="w-44"
            />
          </div>
          {showDeptSelector && (
            <div className="space-y-1">
              <Label htmlFor="sched-dept" className="text-xs">
                {t('scheduling:schedulePage.departmentLabel')}
              </Label>
              <select
                id="sched-dept"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                data-testid="sched-dept-select"
                className="flex h-9 w-44 rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
              >
                <option value="">
                  {t('scheduling:schedulePage.departmentAll')}
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>
      <ScheduleGrid
        weekStart={weekStart}
        departmentId={effectiveDeptId || undefined}
      />
    </div>
  );
};
