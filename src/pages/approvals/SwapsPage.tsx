import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useShiftSwapRequestsQuery,
  useApproveShiftSwapRequestMutation,
  useRejectShiftSwapRequestMutation,
} from '../../api/shift-swap-requests.api';
import { useEmployeesQuery } from '../../api/employees.api';
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
  const { t } = useTranslation();
  const [managerEmployeeId, setManagerEmployeeId] = useState<string | undefined>(
    undefined,
  );
  const list = useShiftSwapRequestsQuery({ managerEmployeeId });
  const employeesQ = useEmployeesQuery();
  const approveMut = useApproveShiftSwapRequestMutation();
  const rejectMut = useRejectShiftSwapRequestMutation();
  const rows = (list.data ?? []) as SwapRow[];

  const employeeNameById = useMemo(
    () =>
      new Map(
        (employeesQ.data ?? []).map((e) => [e.id, e.name] as const),
      ),
    [employeesQ.data],
  );

  const renderEmployee = (id: string) => {
    const name = employeeNameById.get(id);
    return (
      <span
        className={name ? 'font-medium' : 'font-mono text-muted-foreground'}
        title={id}
      >
        {name ?? `${id.slice(0, 8)}…`}
      </span>
    );
  };

  const columns = useMemo<ColumnDef<SwapRow>[]>(
    () => [
      {
        id: 'requester',
        header: t('approvals:swap.table.requester'),
        accessorFn: (r) =>
          employeeNameById.get(r.requesterId) ?? r.requesterId,
        enableGlobalFilter: true,
        cell: ({ row }) => renderEmployee(row.original.requesterId),
      },
      {
        id: 'target',
        header: t('approvals:swap.table.target'),
        accessorFn: (r) => employeeNameById.get(r.targetId) ?? r.targetId,
        enableGlobalFilter: true,
        cell: ({ row }) => renderEmployee(row.original.targetId),
      },
      {
        accessorKey: 'assignmentId',
        header: t('approvals:swap.table.assignment'),
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
        header: t('approvals:swap.table.status'),
        cell: ({ row }) => <Badge>{row.original.status}</Badge>,
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">{t('approvals:swap.table.actions')}</span>
        ),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                title={t('approvals:swap.rowActions.approve')}
                data-testid={`approve-${r.id}`}
                disabled={r.status !== 'pending' || approveMut.isPending}
                onClick={() => approveMut.mutate(r.id)}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t('approvals:swap.rowActions.reject')}
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
    [t, employeeNameById, approveMut, rejectMut],
  );

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-foreground">
          {t('approvals:swap.page.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {list.isLoading
            ? t('approvals:swap.page.summaryLoading')
            : t('approvals:swap.page.summaryCount', { count: rows.length })}
        </p>
      </header>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder={t('approvals:swap.page.searchPlaceholder')}
        toolbar={
          <ManagerScopeFilter
            value={managerEmployeeId}
            onChange={setManagerEmployeeId}
          />
        }
        isLoading={list.isLoading}
        errorMessage={list.isError ? t('approvals:swap.page.loadError') : undefined}
        emptyMessage={t('approvals:swap.page.empty')}
      />
    </div>
  );
};
