import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from '../../api/employees.api';
import { useDepartmentsQuery } from '../../api/scope-targets.api';
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
  const { t } = useTranslation();
  const { data, isLoading, isError } = useEmployeesQuery();
  const createMut = useCreateEmployeeMutation();
  const updateMut = useUpdateEmployeeMutation();
  const deleteMut = useDeleteEmployeeMutation();
  const departmentsQ = useDepartmentsQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOf, setEditOf] = useState<Employee | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const employees = data ?? [];
  const departments = departmentsQ.data ?? [];
  const showDeptFilter = departments.length > 1;

  // Map id → name para resolver scope en la columna.
  const departmentNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of departments) m.set(d.id, d.name);
    return m;
  }, [departments]);

  const roleOptions = useMemo(
    () => Array.from(new Set(employees.map((e) => e.role))).sort(),
    [employees],
  );

  const filteredData = useMemo(() => {
    let out = employees;
    if (roleFilter) out = out.filter((e) => e.role === roleFilter);
    if (departmentFilter) {
      out = out.filter((e) =>
        departmentFilter === '__none__'
          ? !e.departmentId
          : e.departmentId === departmentFilter,
      );
    }
    return out;
  }, [employees, roleFilter, departmentFilter]);

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
        header: t('workforce:employees.table.name'),
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
        header: t('workforce:employees.table.externalId'),
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
        header: t('workforce:employees.table.role'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.role}</span>
        ),
      },
      {
        id: 'department',
        header: t('workforce:employees.table.department'),
        accessorFn: (e) => e.departmentId ?? '',
        cell: ({ row }) => {
          const id = row.original.departmentId;
          if (!id) {
            return (
              <span
                className="text-xs italic text-muted-foreground"
                title={t('workforce:employees.table.departmentNoneTooltip')}
              >
                {t('workforce:employees.table.departmentNone')}
              </span>
            );
          }
          return (
            <span className="text-muted-foreground">
              {departmentNameById.get(id) ?? id.slice(0, 8)}
            </span>
          );
        },
      },
      {
        accessorKey: 'phone',
        header: t('workforce:employees.table.phone'),
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
        header: () => (
          <span className="sr-only">
            {t('workforce:employees.table.actions')}
          </span>
        ),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                title={t('workforce:employees.rowActions.edit')}
                data-testid={`edit-${emp.id}`}
                onClick={() => setEditOf(emp)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t('workforce:employees.rowActions.delete')}
                data-testid={`delete-${emp.id}`}
                disabled={deleteMut.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      t('workforce:employees.table.deleteConfirm', {
                        name: emp.name,
                      }),
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
    [t, deleteMut, departmentNameById],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('workforce:employees.page.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? t('workforce:employees.page.summaryLoading')
              : t('workforce:employees.page.summaryCount', {
                  count: employees.length,
                })}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="new-employee-btn">
          <Plus className="h-4 w-4" /> {t('workforce:employees.page.newButton')}
        </Button>
      </header>

      <DataTable
        data={filteredData}
        columns={columns}
        getRowId={(e) => e.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder={t('workforce:employees.page.searchPlaceholder')}
        toolbar={
          <div className="flex flex-wrap gap-2">
            {roleOptions.length > 0 && (
              <select
                data-testid="role-filter"
                aria-label={t('workforce:employees.filters.filterByRole')}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="flex h-9 rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
              >
                <option value="">
                  {t('workforce:employees.filters.allRoles')}
                </option>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
            {showDeptFilter && (
              <select
                data-testid="department-filter"
                aria-label={t('workforce:employees.filters.filterByDepartment')}
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="flex h-9 rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
              >
                <option value="">
                  {t('workforce:employees.filters.allDepartments')}
                </option>
                <option value="__none__">
                  {t('workforce:employees.filters.noDepartment')}
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        }
        isLoading={isLoading}
        errorMessage={isError ? t('workforce:employees.page.loadError') : undefined}
        emptyMessage={t('workforce:employees.page.empty')}
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
