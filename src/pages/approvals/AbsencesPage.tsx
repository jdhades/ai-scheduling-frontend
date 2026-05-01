import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useAbsenceReportsQuery,
  useCreateAbsenceReportMutation,
  useDeleteAbsenceReportMutation,
} from '../../api/absence-reports.api';
import { useEmployeesQuery } from '../../api/employees.api';
import { DataTable } from '../../components/ui/data-table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/button';
import { ManagerScopeFilter } from './ManagerScopeFilter';
import { CreateAbsenceReportDialog } from './CreateAbsenceReportDialog';

interface AbsenceRow {
  id: string;
  employeeId: string;
  assignmentId: string | null;
  reason: string;
  isUrgent: boolean;
  startDate: string;
  endDate: string;
  reportedAt: string;
}

/**
 * AbsencesPage — listado de reportes de ausencia.
 *
 * Phase 17 — los reportes son períodos (single-day o multi-day). El alta
 * desde el panel borra los assignments del rango y notifica al manager,
 * y el scheduler los respeta como hard constraint al generar.
 *
 * Soft-delete del reporte NO restaura assignments borrados — si el
 * manager necesita reasignar el slot, regenera la semana.
 */
export const AbsencesPage = () => {
  const { t } = useTranslation();
  const [managerEmployeeId, setManagerEmployeeId] = useState<string | undefined>(
    undefined,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const list = useAbsenceReportsQuery({ managerEmployeeId });
  const employeesQ = useEmployeesQuery();
  const createMut = useCreateAbsenceReportMutation();
  const deleteMut = useDeleteAbsenceReportMutation();
  const rows = (list.data ?? []) as AbsenceRow[];

  const employeeNameById = useMemo(
    () =>
      new Map(
        (employeesQ.data ?? []).map((e) => [e.id, e.name] as const),
      ),
    [employeesQ.data],
  );

  const columns = useMemo<ColumnDef<AbsenceRow>[]>(
    () => [
      {
        id: 'employee',
        header: t('approvals:absence.table.employee'),
        accessorFn: (r) =>
          employeeNameById.get(r.employeeId) ?? r.employeeId,
        enableGlobalFilter: true,
        cell: ({ row }) => {
          const name = employeeNameById.get(row.original.employeeId);
          return (
            <span
              className={name ? 'font-medium' : 'font-mono text-muted-foreground'}
              title={row.original.employeeId}
            >
              {name ?? `${row.original.employeeId.slice(0, 8)}…`}
            </span>
          );
        },
      },
      {
        accessorKey: 'assignmentId',
        header: t('approvals:absence.table.assignment'),
        cell: ({ row }) => (
          <span
            className="text-muted-foreground"
            title={row.original.assignmentId ?? ''}
          >
            {row.original.assignmentId
              ? `${row.original.assignmentId.slice(0, 8)}…`
              : '—'}
          </span>
        ),
      },
      {
        id: 'period',
        header: t('approvals:absence.table.period'),
        accessorFn: (r) =>
          r.startDate === r.endDate ? r.startDate : `${r.startDate}_${r.endDate}`,
        cell: ({ row }) => {
          const r = row.original;
          if (r.startDate === r.endDate) {
            return (
              <span className="text-muted-foreground">
                {t('approvals:absence.values.periodSingle', { date: r.startDate })}
              </span>
            );
          }
          return (
            <span className="text-muted-foreground">
              {t('approvals:absence.values.periodRange', {
                start: r.startDate,
                end: r.endDate,
              })}
            </span>
          );
        },
      },
      {
        accessorKey: 'reason',
        header: t('approvals:absence.table.reason'),
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="block max-w-md truncate" title={row.original.reason}>
            {row.original.reason}
          </span>
        ),
      },
      {
        accessorKey: 'isUrgent',
        header: t('approvals:absence.table.urgent'),
        cell: ({ row }) =>
          row.original.isUrgent ? (
            <Badge>{t('approvals:absence.values.urgent')}</Badge>
          ) : (
            <span className="text-muted-foreground">
              {t('approvals:absence.values.notUrgent')}
            </span>
          ),
      },
      {
        accessorKey: 'reportedAt',
        header: t('approvals:absence.table.reportedAt'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.reportedAt).toLocaleString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">{t('approvals:absence.table.actions')}</span>
        ),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              title={t('approvals:absence.rowActions.delete')}
              data-testid={`delete-${row.original.id}`}
              disabled={deleteMut.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    t('approvals:absence.rowActions.deleteConfirm'),
                  )
                ) {
                  deleteMut.mutate(row.original.id);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
        meta: { headerClassName: 'w-20', cellClassName: 'text-right' },
      },
    ],
    [t, employeeNameById, deleteMut],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('approvals:absence.page.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {list.isLoading
              ? t('approvals:absence.page.summaryLoading')
              : t('approvals:absence.page.summaryCount', { count: rows.length })}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          data-testid="new-absence-btn"
          disabled={employeesQ.isLoading}
        >
          <Plus className="h-4 w-4" /> {t('approvals:common.newButton')}
        </Button>
      </header>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder={t('approvals:absence.page.searchPlaceholder')}
        toolbar={
          <ManagerScopeFilter
            value={managerEmployeeId}
            onChange={setManagerEmployeeId}
          />
        }
        isLoading={list.isLoading}
        errorMessage={list.isError ? t('approvals:absence.page.loadError') : undefined}
        emptyMessage={t('approvals:absence.page.empty')}
      />

      <CreateAbsenceReportDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        employees={employeesQ.data ?? []}
        onSubmit={(payload) =>
          createMut.mutateAsync(payload).then(() => setCreateOpen(false))
        }
        submitting={createMut.isPending}
      />
    </div>
  );
};
