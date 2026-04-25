import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
        header: 'Empleado',
        // accessorFn → search/sort opera sobre el nombre resuelto, no el UUID.
        accessorFn: (m) => empById.get(m.employeeId) ?? m.employeeId,
        enableGlobalFilter: true,
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        id: 'template',
        header: 'Template',
        accessorFn: (m) => tplById.get(m.templateId) ?? m.templateId,
        enableGlobalFilter: true,
        cell: ({ getValue }) => getValue() as string,
      },
      {
        accessorKey: 'effectiveFrom',
        header: 'Desde',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.effectiveFrom}</span>
        ),
      },
      {
        accessorKey: 'effectiveUntil',
        header: 'Hasta',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.effectiveUntil ?? 'abierto'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const m = row.original;
          return (
            <Button
              variant="ghost"
              size="icon"
              title="Eliminar"
              data-testid={`delete-${m.id}`}
              disabled={deleteMut.isPending}
              onClick={() => {
                if (window.confirm('¿Eliminar este membership?')) {
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
    [empById, tplById, deleteMut],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Memberships</h1>
          <p className="text-sm text-muted-foreground">
            {memberships.isLoading
              ? 'Cargando…'
              : `${rows.length} vínculo${rows.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          data-testid="new-membership-btn"
          disabled={employees.isLoading || templates.isLoading}
        >
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </header>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(m) => m.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder="Buscar por empleado o template…"
        isLoading={memberships.isLoading}
        errorMessage={
          memberships.isError ? 'Error cargando memberships.' : undefined
        }
        emptyMessage="No hay memberships todavía."
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
