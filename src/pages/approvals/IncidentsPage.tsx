import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Plus, X } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useIncidentsQuery,
  useRejectIncidentMutation,
  useResolveIncidentMutation,
  useCreateIncidentMutation,
} from '../../api/incidents.api';
import { useEmployeesQuery } from '../../api/employees.api';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Badge } from '../../components/ui/Badge';
import { ManagerScopeFilter } from './ManagerScopeFilter';
import { CreateIncidentDialog } from './CreateIncidentDialog';
import type { Incident, IncidentStatus } from '../../types/approvals';

const isClosed = (s: IncidentStatus) => s === 'rejected' || s === 'resolved';

export const IncidentsPage = () => {
  const { t } = useTranslation();
  const [managerEmployeeId, setManagerEmployeeId] = useState<string | undefined>(
    undefined,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const list = useIncidentsQuery({ managerEmployeeId });
  const employeesQ = useEmployeesQuery();
  const rejectMut = useRejectIncidentMutation();
  const resolveMut = useResolveIncidentMutation();
  const createMut = useCreateIncidentMutation();
  const [actingOn, setActingOn] = useState<string | null>(null);

  const rows = list.data ?? [];

  const handleReject = (i: Incident) => {
    const reason = window.prompt(
      t('approvals:incident.rowActions.rejectPrompt', { id: i.id }),
    );
    if (!reason || !reason.trim()) return;
    setActingOn(i.id);
    rejectMut.mutate(
      { id: i.id, reason: reason.trim() },
      { onSettled: () => setActingOn(null) },
    );
  };

  const handleResolve = (i: Incident) => {
    const details = window.prompt(
      t('approvals:incident.rowActions.resolvePrompt', { id: i.id }),
    );
    if (!details || !details.trim()) return;
    setActingOn(i.id);
    resolveMut.mutate(
      { id: i.id, details: details.trim() },
      { onSettled: () => setActingOn(null) },
    );
  };

  const columns = useMemo<ColumnDef<Incident>[]>(
    () => [
      {
        accessorKey: 'employeeId',
        header: t('approvals:incident.table.employee'),
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="font-medium" title={row.original.employeeId}>
            {row.original.employeeId.slice(0, 8)}…
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: t('approvals:incident.table.type'),
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.type}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('approvals:incident.table.status'),
        // Sort por status string; mostramos label.
        cell: ({ row }) => (
          <Badge>{t(`approvals:incident.status.${row.original.status}`)}</Badge>
        ),
      },
      {
        id: 'period',
        header: t('approvals:incident.table.period'),
        accessorFn: (i) =>
          i.startDate ? `${i.startDate}${i.endDate ? ` → ${i.endDate}` : ''}` : '',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.startDate
              ? `${row.original.startDate}${row.original.endDate ? ` → ${row.original.endDate}` : ''}`
              : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">
            {t('approvals:incident.table.actions')}
          </span>
        ),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const i = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                title={t('approvals:incident.rowActions.reject')}
                data-testid={`reject-${i.id}`}
                disabled={isClosed(i.status) || actingOn === i.id}
                onClick={() => handleReject(i)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t('approvals:incident.rowActions.resolve')}
                data-testid={`resolve-${i.id}`}
                disabled={isClosed(i.status) || actingOn === i.id}
                onClick={() => handleResolve(i)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
        meta: { headerClassName: 'w-32', cellClassName: 'text-right' },
      },
    ],
    // actingOn debe re-disparar el render del disabled. rejectMut/resolveMut
    // son estables.
    [t, actingOn],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('approvals:incident.page.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {list.isLoading
              ? t('approvals:incident.page.summaryLoading')
              : t('approvals:incident.page.summaryCount', { count: rows.length })}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          data-testid="new-incident-btn"
          disabled={employeesQ.isLoading}
        >
          <Plus className="h-4 w-4" /> {t('approvals:common.newButton')}
        </Button>
      </header>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(i) => i.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder={t('approvals:incident.page.searchPlaceholder')}
        toolbar={
          <ManagerScopeFilter
            value={managerEmployeeId}
            onChange={setManagerEmployeeId}
          />
        }
        isLoading={list.isLoading}
        errorMessage={list.isError ? t('approvals:incident.page.loadError') : undefined}
        emptyMessage={t('approvals:incident.page.empty')}
      />

      <CreateIncidentDialog
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
