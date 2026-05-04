import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Clock } from 'lucide-react';
import { useActiveScheduleJobQuery } from '../../api/schedule.api';

/**
 * ScheduleJobBanner — banner global visible en cualquier página mientras
 * haya jobs `schedule.generate` en estados no-terminales para la company.
 *
 * Source: `/jobs/active` (poleado cada 3s por `useActiveScheduleJobQuery`).
 * Sobrevive a navegaciones porque el estado vive en el backend.
 *
 * UX:
 *   - 0 jobs activos → renderiza nada (no ocupa espacio).
 *   - 1 job → muestra el state + week + link a Generar.
 *   - 2+ → muestra "N generaciones en curso".
 */
export const ScheduleJobBanner = () => {
  const { t } = useTranslation();
  const activeQ = useActiveScheduleJobQuery();
  const jobs = activeQ.data ?? [];

  if (jobs.length === 0) return null;

  const isMulti = jobs.length > 1;
  const head = jobs[0];
  const isPending = head.state === 'created' || head.state === 'retry';

  return (
    <div className="mx-6 mt-3 rounded-md border border-blue-400/30 bg-blue-500/10 px-4 py-2.5">
      <Link
        to="/scheduling/generate"
        className="flex items-center justify-between gap-3 text-sm text-foreground hover:text-blue-200 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isPending ? (
            <Clock className="w-4 h-4 text-blue-300 shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin text-blue-300 shrink-0" />
          )}
          <span className="truncate">
            {isMulti
              ? t('common:scheduleJobBanner.multi', { count: jobs.length })
              : isPending
                ? t('common:scheduleJobBanner.queued', {
                    weekStart: head.payload.weekStart,
                  })
                : t('common:scheduleJobBanner.active', {
                    weekStart: head.payload.weekStart,
                  })}
          </span>
        </div>
        <span className="text-xs text-blue-300/80 shrink-0">
          {t('common:scheduleJobBanner.viewLink')}
        </span>
      </Link>
    </div>
  );
};
