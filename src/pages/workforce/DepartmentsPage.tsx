import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useDepartmentsQuery,
  useUpdateDepartmentMutation,
  type Department,
} from '../../api/scope-targets.api';
import { useEmployeesQuery } from '../../api/employees.api';
import type { Employee } from '../../types/employee';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { DepartmentManagerDialog } from './DepartmentManagerDialog';

/**
 * DepartmentsPage — listado de departamentos del tenant con su manager
 * asignado. Phase 15.1 — primer caso de uso es asignar el
 * `managerEmployeeId` para que el routing de approvals (Fase 2) sepa a
 * quién enrutar swap/absence/incident/day-off.
 *
 * Read-only sobre branchId/name por ahora; el rename se hará en una
 * iteración posterior si aparece el caso.
 */
export const DepartmentsPage = () => {
  const { t } = useTranslation();
  const list = useDepartmentsQuery();
  const employeesQ = useEmployeesQuery();
  const updateMut = useUpdateDepartmentMutation();

  const [editOf, setEditOf] = useState<Department | null>(null);

  const rows = list.data ?? [];
  const employees = employeesQ.data ?? [];

  const employeeNameById = useMemo(
    () => new Map(employees.map((e) => [e.id, e.name] as const)),
    [employees],
  );

  // Filtramos a employees con role='manager' como sugerencia primaria.
  // El backend acepta cualquier employee del tenant — la UI solo guía.
  const managerCandidates: Employee[] = useMemo(
    () => employees.filter((e) => e.role === 'manager'),
    [employees],
  );

  const columns = useMemo<ColumnDef<Department>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('workforce:departments.table.name'),
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: 'manager',
        header: t('workforce:departments.table.manager'),
        accessorFn: (d) =>
          d.managerEmployeeId
            ? employeeNameById.get(d.managerEmployeeId) ?? d.managerEmployeeId
            : '',
        enableGlobalFilter: true,
        cell: ({ row }) => {
          const id = row.original.managerEmployeeId;
          if (!id) {
            return (
              <span
                className="text-xs italic text-muted-foreground"
                title={t('workforce:departments.table.managerNoneTooltip')}
              >
                {t('workforce:departments.table.managerNone')}
              </span>
            );
          }
          const name = employeeNameById.get(id);
          return (
            <span className="text-muted-foreground">
              {name ?? id.slice(0, 8)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">
            {t('workforce:departments.table.actions')}
          </span>
        ),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              title={t('workforce:departments.rowActions.edit')}
              data-testid={`edit-${row.original.id}`}
              onClick={() => setEditOf(row.original)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
        meta: { headerClassName: 'w-20', cellClassName: 'text-right' },
      },
    ],
    [t, employeeNameById],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('workforce:departments.page.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {list.isLoading
              ? t('workforce:departments.page.summaryLoading')
              : t('workforce:departments.page.summaryCount', {
                  count: rows.length,
                })}
          </p>
        </div>
      </header>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(d) => d.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder={t('workforce:departments.page.searchPlaceholder')}
        isLoading={list.isLoading}
        errorMessage={
          list.isError ? t('workforce:departments.page.loadError') : undefined
        }
        emptyMessage={t('workforce:departments.page.empty')}
      />

      <DepartmentManagerDialog
        department={editOf}
        managerCandidates={managerCandidates}
        allEmployees={employees}
        onOpenChange={(o) => !o && setEditOf(null)}
        onSubmit={async (managerEmployeeId) => {
          if (!editOf) return;
          await updateMut.mutateAsync({
            id: editOf.id,
            patch: { managerEmployeeId },
          });
          setEditOf(null);
        }}
        submitting={updateMut.isPending}
      />
    </div>
  );
};
