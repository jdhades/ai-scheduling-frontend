import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Plus, X } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useDayOffRequestsQuery,
  useApproveDayOffRequestMutation,
  useRejectDayOffRequestMutation,
  useCreateDayOffRequestMutation,
} from '../../api/day-off-requests.api';
import { useEmployeesQuery } from '../../api/employees.api';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Badge } from '../../components/ui/Badge';
import { ManagerScopeFilter } from './ManagerScopeFilter';
import { CreateDayOffRequestDialog } from './CreateDayOffRequestDialog';

interface DayOffRow {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
  status: string;
}

export const DayOffsPage = () => {
  const { t } = useTranslation();
  const [managerEmployeeId, setManagerEmployeeId] = useState<string | undefined>(
    undefined,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const list = useDayOffRequestsQuery({ managerEmployeeId });
  const employeesQ = useEmployeesQuery();
  const approveMut = useApproveDayOffRequestMutation();
  const rejectMut = useRejectDayOffRequestMutation();
  const createMut = useCreateDayOffRequestMutation();
  const rows = (list.data ?? []) as DayOffRow[];

  const columns = useMemo<ColumnDef<DayOffRow>[]>(
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
        accessorKey: 'date',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.date}</span>
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
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <Badge>{row.original.status}</Badge>,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                title="Aprobar"
                data-testid={`approve-${r.id}`}
                disabled={r.status !== 'pending' || approveMut.isPending}
                onClick={() => approveMut.mutate(r.id)}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Rechazar"
                data-testid={`reject-${r.id}`}
                disabled={r.status !== 'pending' || rejectMut.isPending}
                onClick={() => rejectMut.mutate(r.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
        meta: { headerClassName: 'w-32', cellClassName: 'text-right' },
      },
    ],
    [approveMut, rejectMut],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Solicitudes de día libre</h1>
          <p className="text-sm text-muted-foreground">
            {list.isLoading
              ? 'Cargando…'
              : `${rows.length} pedido${rows.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          data-testid="new-dayoff-btn"
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
        errorMessage={list.isError ? 'Error cargando day-offs.' : undefined}
        emptyMessage="No hay solicitudes."
      />

      <CreateDayOffRequestDialog
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
