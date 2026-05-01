import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useAbsenceReportsQuery,
  useCreateAbsenceReportMutation,
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
  reportedAt: string;
}

/**
 * AbsencesPage — listado read-only. Los reportes son inmutables;
 * sin acciones. Para crear uno nuevo se hace via WhatsApp o
 * via POST /absence-reports desde una pantalla aparte (futura).
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
  const rows = (list.data ?? []) as AbsenceRow[];

  const columns = useMemo<ColumnDef<AbsenceRow>[]>(
    () => [
      {
        accessorKey: 'employeeId',
        header: 'Empleado',
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span title={row.original.employeeId}>
            {row.original.employeeId.slice(0, 8)}…
          </span>
        ),
      },
      {
        accessorKey: 'assignmentId',
        header: 'Assignment',
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
        accessorKey: 'reason',
        header: 'Razón',
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="block max-w-md truncate" title={row.original.reason}>
            {row.original.reason}
          </span>
        ),
      },
      {
        accessorKey: 'isUrgent',
        header: 'Urgente',
        cell: ({ row }) =>
          row.original.isUrgent ? (
            <Badge>urgente</Badge>
          ) : (
            <span className="text-muted-foreground">no</span>
          ),
      },
      {
        accessorKey: 'reportedAt',
        header: 'Reportado',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.reportedAt).toLocaleString()}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reportes de ausencia</h1>
          <p className="text-sm text-muted-foreground">
            {list.isLoading
              ? 'Cargando…'
              : `${rows.length} reporte${rows.length === 1 ? '' : 's'}`}
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
        searchPlaceholder="Buscar por empleado o razón…"
        toolbar={
          <ManagerScopeFilter
            value={managerEmployeeId}
            onChange={setManagerEmployeeId}
          />
        }
        isLoading={list.isLoading}
        errorMessage={list.isError ? 'Error cargando ausencias.' : undefined}
        emptyMessage="No hay ausencias reportadas."
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
