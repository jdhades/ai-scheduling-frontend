import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Plus, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useShiftMembershipsQuery,
  useCreateShiftMembershipMutation,
  useDeleteShiftMembershipMutation,
} from '../../api/shift-memberships.api';
import { useEmployeesQuery } from '../../api/employees.api';
import { useShiftTemplatesQuery } from '../../api/shift-templates.api';
import type { ShiftMembership } from '../../types/shift-membership';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { MembershipFormDialog } from './MembershipFormDialog';

/**
 * MembershipsPage — vínculos empleado ↔ template del tenant.
 *
 * Sin PATCH: para cambiar template/fechas, eliminar y recrear (la
 * arquitectura del backend lo fuerza así para mantener auditabilidad).
 */
export const MembershipsPage = () => {
  const { t } = useTranslation();
  const memberships = useShiftMembershipsQuery();
  const employees = useEmployeesQuery();
  const templates = useShiftTemplatesQuery();
  const createMut = useCreateShiftMembershipMutation();
  const deleteMut = useDeleteShiftMembershipMutation();

  const [createOpen, setCreateOpen] = useState(false);

  const empById = useMemo(
    () =>
      new Map((employees.data ?? []).map((e) => [e.id, e.name] as const)),
    [employees.data],
  );
  const tplById = useMemo(
    () =>
      new Map((templates.data ?? []).map((t) => [t.id, t.name] as const)),
    [templates.data],
  );

  const rows = memberships.data ?? [];

  const columns = useMemo<ColumnDef<ShiftMembership>[]>(
    () => [
      {
        id: 'employee',
        header: t('workforce:memberships.table.employee'),
        accessorFn: (m) => empById.get(m.employeeId) ?? m.employeeId,
        enableGlobalFilter: true,
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        id: 'template',
        header: t('workforce:memberships.table.template'),
        accessorFn: (m) => tplById.get(m.templateId) ?? m.templateId,
        enableGlobalFilter: true,
        cell: ({ row }) => {
          const name = tplById.get(row.original.templateId);
          if (name) return name;
          return (
            <span
              className="font-mono text-muted-foreground"
              title={row.original.templateId}
            >
              …{row.original.templateId.slice(-8)}
            </span>
          );
        },
      },
      {
        accessorKey: 'effectiveFrom',
        header: t('workforce:memberships.table.from'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.effectiveFrom}</span>
        ),
      },
      {
        accessorKey: 'effectiveUntil',
        header: t('workforce:memberships.table.until'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.effectiveUntil ??
              t('workforce:memberships.table.untilOpen')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">
            {t('workforce:memberships.table.actions')}
          </span>
        ),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const m = row.original;
          return (
            <Button
              variant="ghost"
              size="icon"
              title={t('workforce:memberships.rowActions.delete')}
              data-testid={`delete-${m.id}`}
              disabled={deleteMut.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    t('workforce:memberships.rowActions.deleteConfirm'),
                  )
                ) {
                  deleteMut.mutate(m.id);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          );
        },
        meta: { headerClassName: 'w-20', cellClassName: 'text-right' },
      },
    ],
    [t, empById, tplById, deleteMut],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('workforce:memberships.page.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {memberships.isLoading
              ? t('workforce:memberships.page.summaryLoading')
              : t('workforce:memberships.page.summaryCount', {
                  count: rows.length,
                })}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          data-testid="new-membership-btn"
          disabled={employees.isLoading || templates.isLoading}
        >
          <Plus className="h-4 w-4" />{' '}
          {t('workforce:memberships.page.newButton')}
        </Button>
      </header>

      <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p>{t('workforce:memberships.page.info')}</p>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(m) => m.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder={t('workforce:memberships.page.searchPlaceholder')}
        isLoading={memberships.isLoading}
        errorMessage={
          memberships.isError
            ? t('workforce:memberships.page.loadError')
            : undefined
        }
        emptyMessage={t('workforce:memberships.page.empty')}
      />

      <MembershipFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        employees={employees.data ?? []}
        templates={templates.data ?? []}
        onSubmit={(payload) =>
          createMut.mutateAsync(payload).then(() => setCreateOpen(false))
        }
        submitting={createMut.isPending}
      />
    </div>
  );
};
