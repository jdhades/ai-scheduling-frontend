import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useShiftSwapRequestsQuery,
  useApproveShiftSwapRequestMutation,
  useRejectShiftSwapRequestMutation,
} from '../../api/shift-swap-requests.api';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Badge } from '../../components/ui/Badge';
import { ManagerScopeFilter } from './ManagerScopeFilter';

interface SwapRow {
  id: string;
  requesterId: string;
  targetId: string;
  assignmentId: string | null;
  status: string;
}

export const SwapsPage = () => {
  const [managerEmployeeId, setManagerEmployeeId] = useState<string | undefined>(
    undefined,
  );
  const list = useShiftSwapRequestsQuery({ managerEmployeeId });
  const approveMut = useApproveShiftSwapRequestMutation();
  const rejectMut = useRejectShiftSwapRequestMutation();
  const rows = (list.data ?? []) as SwapRow[];

  const columns = useMemo<ColumnDef<SwapRow>[]>(
    () => [
      {
        accessorKey: 'requesterId',
        header: 'Pide',
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span title={row.original.requesterId}>
            {row.original.requesterId.slice(0, 8)}…
          </span>
        ),
      },
      {
        accessorKey: 'targetId',
        header: 'A',
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span title={row.original.targetId}>
            {row.original.targetId.slice(0, 8)}…
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
      <header>
        <h1 className="text-xl font-bold text-foreground">Shift swap requests</h1>
        <p className="text-sm text-muted-foreground">
          {list.isLoading
            ? 'Cargando…'
            : `${rows.length} pedido${rows.length === 1 ? '' : 's'}`}
        </p>
      </header>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder="Buscar por empleado…"
        toolbar={
          <ManagerScopeFilter
            value={managerEmployeeId}
            onChange={setManagerEmployeeId}
          />
        }
        isLoading={list.isLoading}
        errorMessage={list.isError ? 'Error cargando swaps.' : undefined}
        emptyMessage="No hay swap requests."
      />
    </div>
  );
};
