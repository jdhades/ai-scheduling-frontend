import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  useShiftMembershipsQuery,
  useCreateShiftMembershipMutation,
  useDeleteShiftMembershipMutation,
} from '../../api/shift-memberships.api';
import { useEmployeesQuery } from '../../api/employees.api';
import { useShiftTemplatesQuery } from '../../api/shift-templates.api';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
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

  const empById = new Map(
    (employees.data ?? []).map((e) => [e.id, e.name] as const),
  );
  const tplById = new Map(
    (templates.data ?? []).map((t) => [t.id, t.name] as const),
  );

  const rows = memberships.data ?? [];

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
          <Plus className="w-4 h-4" /> Nuevo
        </Button>
      </header>

      {memberships.isError && (
        <div className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          Error cargando memberships.
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-surface-low">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead>Hasta</TableHead>
              <TableHead className="w-20 text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Cargando…
                </TableCell>
              </TableRow>
            )}
            {!memberships.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay memberships todavía.
                </TableCell>
              </TableRow>
            )}
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  {empById.get(m.employeeId) ?? m.employeeId}
                </TableCell>
                <TableCell>{tplById.get(m.templateId) ?? m.templateId}</TableCell>
                <TableCell className="text-muted-foreground">{m.effectiveFrom}</TableCell>
                <TableCell className="text-muted-foreground">
                  {m.effectiveUntil ?? 'abierto'}
                </TableCell>
                <TableCell className="text-right">
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
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
