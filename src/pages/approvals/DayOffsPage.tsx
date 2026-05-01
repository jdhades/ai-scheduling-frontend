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

  const employeeNameById = useMemo(
    () =>
      new Map(
        (employeesQ.data ?? []).map((e) => [e.id, e.name] as const),
      ),
    [employeesQ.data],
  );

  const columns = useMemo<ColumnDef<DayOffRow>[]>(
    () => [
      {
        id: 'employee',
        header: t('approvals:dayOff.table.employee'),
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
        accessorKey: 'date',
        header: t('approvals:dayOff.table.date'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.date}</span>
        ),
      },
      {
        accessorKey: 'reason',
        header: t('approvals:dayOff.table.reason'),
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="block max-w-md truncate" title={row.original.reason}>
            {row.original.reason}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('approvals:dayOff.table.status'),
        cell: ({ row }) => <Badge>{row.original.status}</Badge>,
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">{t('approvals:dayOff.table.actions')}</span>
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
                title={t('approvals:dayOff.rowActions.approve')}
                data-testid={`approve-${r.id}`}
                disabled={r.status !== 'pending' || approveMut.isPending}
                onClick={() => approveMut.mutate(r.id)}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t('approvals:dayOff.rowActions.reject')}
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('approvals:dayOff.page.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {list.isLoading
              ? t('approvals:dayOff.page.summaryLoading')
              : t('approvals:dayOff.page.summaryCount', { count: rows.length })}
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
        searchPlaceholder={t('approvals:dayOff.page.searchPlaceholder')}
        toolbar={
          <ManagerScopeFilter
            value={managerEmployeeId}
            onChange={setManagerEmployeeId}
          />
        }
        isLoading={list.isLoading}
        errorMessage={list.isError ? t('approvals:dayOff.page.loadError') : undefined}
        emptyMessage={t('approvals:dayOff.page.empty')}
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
