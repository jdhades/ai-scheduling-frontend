import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import {
  useEmployeesQuery,
  useCreateEmployeeMutation,
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
import { EmployeeFormDialog } from './EmployeeFormDialog';

/**
 * EmployeesPage — listado del tenant con acciones inline.
 *
 * Soporta:
 *   - listar (`useEmployeesQuery`)
 *   - crear (dialog → `useCreateEmployeeMutation`)
 *   - editar (dialog navegando al detalle — TODO en F.2.1bis)
 *   - eliminar (confirm inline → `useDeleteEmployeeMutation`)
 */
export const EmployeesPage = () => {
  const { data, isLoading, isError } = useEmployeesQuery();
  const createMut = useCreateEmployeeMutation();
  const deleteMut = useDeleteEmployeeMutation();

  const [createOpen, setCreateOpen] = useState(false);

  const employees = data ?? [];

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

      <div className="rounded-lg border border-white/5 bg-surface-low">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="w-32 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Cargando…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No hay empleados todavía.
                </TableCell>
              </TableRow>
            )}
            {employees.map((emp: Employee) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">
                  <Link
                    to={`/workforce/employees/${emp.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {emp.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{emp.role}</TableCell>
                <TableCell className="text-muted-foreground">
                  {emp.phone ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar"
                      data-testid={`edit-${emp.id}`}
                      disabled
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
        onSubmit={(payload) =>
          createMut.mutateAsync(payload).then(() => setCreateOpen(false))
        }
        submitting={createMut.isPending}
      />
    </div>
  );
};
