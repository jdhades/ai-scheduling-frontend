import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from '../../api/employees.api';
import type { Employee } from '../../types/employee';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import {
  EmployeeFormDialog,
  type EmployeeFormValues,
} from './EmployeeFormDialog';

/**
 * EmployeesPage — listado del tenant con acciones inline, búsqueda global
 * y filtro por rol. Las columnas declaran su comportamiento de sort/filter
 * vía `ColumnDef`; el resto lo maneja `<DataTable>`.
 */
export const EmployeesPage = () => {
  const { data, isLoading, isError } = useEmployeesQuery();
  const createMut = useCreateEmployeeMutation();
  const updateMut = useUpdateEmployeeMutation();
  const deleteMut = useDeleteEmployeeMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOf, setEditOf] = useState<Employee | null>(null);
  const [roleFilter, setRoleFilter] = useState('');

  const employees = data ?? [];

  const roleOptions = useMemo(
    () => Array.from(new Set(employees.map((e) => e.role))).sort(),
    [employees],
  );

  const filteredData = useMemo(
    () => (roleFilter ? employees.filter((e) => e.role === roleFilter) : employees),
    [employees, roleFilter],
  );

  const handleCreate = async (values: EmployeeFormValues) => {
    await createMut.mutateAsync(values);
    setCreateOpen(false);
  };

  const handleEdit = async (values: EmployeeFormValues) => {
    if (!editOf) return;
    await updateMut.mutateAsync({
      id: editOf.id,
      patch: {
        name: values.name,
        phoneNumber: values.phone,
        experienceMonths: values.experienceMonths,
        externalId: values.externalId ?? null,
      },
    });
    setEditOf(null);
  };

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <Link
            to={`/workforce/employees/${row.original.id}`}
            className="block truncate font-medium transition-colors hover:text-primary"
            title={row.original.name}
          >
            {row.original.name}
          </Link>
        ),
        meta: { cellClassName: 'max-w-[16rem]' },
      },
      {
        accessorKey: 'externalId',
        header: 'ID externo',
        enableGlobalFilter: true,
        cell: ({ row }) => row.original.externalId ?? '—',
        meta: {
          headerClassName: 'hidden md:table-cell',
          cellClassName:
            'hidden md:table-cell max-w-[10rem] truncate text-muted-foreground',
        },
      },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.role}</span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Teléfono',
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.phone ?? '—'}</span>
        ),
        meta: {
          headerClassName: 'hidden sm:table-cell',
          cellClassName: 'hidden sm:table-cell',
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                title="Editar"
                data-testid={`edit-${emp.id}`}
                onClick={() => setEditOf(emp)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Eliminar"
                data-testid={`delete-${emp.id}`}
                disabled={deleteMut.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Eliminar a ${emp.name}? La acción es reversible (soft delete).`,
                    )
                  ) {
                    deleteMut.mutate(emp.id);
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
        meta: { headerClassName: 'w-32', cellClassName: 'text-right' },
      },
    ],
    [deleteMut],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Empleados</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Cargando…'
              : `${employees.length} empleado${employees.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="new-employee-btn">
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </header>

      <DataTable
        data={filteredData}
        columns={columns}
        getRowId={(e) => e.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder="Buscar por nombre, ID o teléfono…"
        toolbar={
          roleOptions.length > 0 ? (
            <select
              data-testid="role-filter"
              aria-label="Filtrar por rol"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex h-9 rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
            >
              <option value="">Todos los roles</option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : null
        }
        isLoading={isLoading}
        errorMessage={isError ? 'Error cargando empleados.' : undefined}
        emptyMessage="No hay empleados todavía."
      />

      <EmployeeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        submitting={createMut.isPending}
      />
      <EmployeeFormDialog
        open={!!editOf}
        onOpenChange={(o) => !o && setEditOf(null)}
        initial={editOf}
        onSubmit={handleEdit}
        submitting={updateMut.isPending}
      />
    </div>
  );
};
