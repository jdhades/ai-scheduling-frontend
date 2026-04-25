import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import {
  useEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from '../../api/employees.api';
import type { Employee } from '../../types/employee';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  EmployeeFormDialog,
  type EmployeeFormValues,
} from './EmployeeFormDialog';

/**
 * EmployeesPage — listado del tenant con acciones inline.
 *
 * Soporta:
 *   - listar (`useEmployeesQuery`)
 *   - crear (dialog → `useCreateEmployeeMutation`)
 *   - editar (mismo dialog en modo edit → `useUpdateEmployeeMutation`)
 *   - eliminar (confirm inline → `useDeleteEmployeeMutation`)
 */
export const EmployeesPage = () => {
  const { data, isLoading, isError } = useEmployeesQuery();
  const createMut = useCreateEmployeeMutation();
  const updateMut = useUpdateEmployeeMutation();
  const deleteMut = useDeleteEmployeeMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOf, setEditOf] = useState<Employee | null>(null);

  const employees = data ?? [];

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
          <Plus className="w-4 h-4" /> Nuevo
        </Button>
      </header>

      {isError && (
        <div className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          Error cargando empleados.
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-surface-low overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">ID externo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
              <TableHead className="w-32 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Cargando…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay empleados todavía.
                </TableCell>
              </TableRow>
            )}
            {employees.map((emp: Employee) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium max-w-[16rem]">
                  <Link
                    to={`/workforce/employees/${emp.id}`}
                    className="hover:text-primary transition-colors block truncate"
                    title={emp.name}
                  >
                    {emp.name}
                  </Link>
                </TableCell>
                <TableCell
                  className="hidden md:table-cell text-muted-foreground max-w-[10rem] truncate"
                  title={emp.externalId ?? undefined}
                >
                  {emp.externalId ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">{emp.role}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {emp.phone ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar"
                      data-testid={`edit-${emp.id}`}
                      onClick={() => setEditOf(emp)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
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
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
