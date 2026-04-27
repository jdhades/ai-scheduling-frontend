import { useMemo, useState } from 'react';
import { Plus, Trash2, Power, AlertTriangle, Sparkles, Info } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useCompanyPoliciesQuery,
  useCreateCompanyPolicyMutation,
  useUpdateCompanyPolicyMutation,
  useDeleteCompanyPolicyMutation,
} from '../../api/company-policies.api';
import type { CompanyPolicy } from '../../types/company-policy';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Badge } from '../../components/ui/Badge';
import { CompanyPolicyFormDialog } from './CompanyPolicyFormDialog';

/**
 * CompanyPoliciesPage — políticas tenant-wide del scheduler.
 *
 * Coexiste con Reglas semánticas:
 *   - Reglas: caso particular ("Pablo no trabaja los lunes").
 *   - Políticas: invariante para todos los empleados ("11h descanso entre
 *     turnos", "2 días libres por semana").
 *
 * Cada política puede estar asociada a un "interpreter" del sistema
 * (constraint deterministic) o ser LLM-only (solo se pasa al prompt
 * de schedule generation).
 */
export const CompanyPoliciesPage = () => {
  const list = useCompanyPoliciesQuery();
  const createMut = useCreateCompanyPolicyMutation();
  const updateMut = useUpdateCompanyPolicyMutation();
  const deleteMut = useDeleteCompanyPolicyMutation();

  const [createOpen, setCreateOpen] = useState(false);

  const rows = list.data ?? [];

  const columns = useMemo<ColumnDef<CompanyPolicy>[]>(
    () => [
      {
        accessorKey: 'text',
        header: 'Política',
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span
            className="block max-w-md truncate font-medium"
            title={row.original.text}
          >
            {row.original.text}
          </span>
        ),
      },
      {
        accessorKey: 'severity',
        header: 'Severidad',
        cell: ({ row }) => (
          <Badge>
            {row.original.severity === 'hard' ? 'HARD' : 'SOFT'}
          </Badge>
        ),
      },
      {
        accessorKey: 'hasInterpreter',
        header: 'Aplicación',
        // Sort booleano (true antes que false).
        cell: ({ row }) => {
          if (row.original.hasInterpreter) {
            return (
              <span
                className="inline-flex items-center gap-1 text-primary"
                title={`Interpreter: ${row.original.interpreterId}. El solver la aplica deterministicamente.`}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs">Determinística</span>
              </span>
            );
          }
          return (
            <span
              className="inline-flex items-center gap-1 text-muted-foreground"
              title="Sin interpreter — solo se pasa al LLM en la fase de generación."
            >
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">LLM-only</span>
            </span>
          );
        },
      },
      {
        id: 'params',
        header: 'Parámetros',
        enableSorting: false,
        cell: ({ row }) => {
          const keys = Object.keys(row.original.params);
          if (keys.length === 0) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <span
              className="font-mono text-xs text-muted-foreground"
              title={JSON.stringify(row.original.params)}
            >
              {keys
                .slice(0, 2)
                .map((k) => `${k}=${String(row.original.params[k])}`)
                .join(', ')}
              {keys.length > 2 ? '…' : ''}
            </span>
          );
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Activa',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.isActive ? 'sí' : 'no'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                title={p.isActive ? 'Desactivar' : 'Activar'}
                data-testid={`toggle-${p.id}`}
                disabled={updateMut.isPending}
                onClick={() =>
                  updateMut.mutate({
                    id: p.id,
                    patch: { isActive: !p.isActive },
                  })
                }
              >
                <Power className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Eliminar"
                data-testid={`delete-${p.id}`}
                disabled={deleteMut.isPending}
                onClick={() => {
                  if (window.confirm(`¿Eliminar la política "${p.text.slice(0, 60)}…"?`)) {
                    deleteMut.mutate(p.id);
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
    [updateMut, deleteMut],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Políticas de la empresa
          </h1>
          <p className="text-sm text-muted-foreground">
            {list.isLoading
              ? 'Cargando…'
              : `${rows.length} política${rows.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="new-policy-btn">
          <Plus className="h-4 w-4" /> Nueva
        </Button>
      </header>

      <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p>
          Las políticas son <span className="font-medium">tenant-wide</span> —
          aplican a todos los empleados (ej. 11h descanso entre turnos). Para
          excepciones por persona o fecha, usá <span className="font-medium">Reglas semánticas</span>.
          La IA detecta automáticamente patrones conocidos; si no, propone
          reformulaciones que sí se puedan aplicar.
        </p>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(p) => p.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder="Buscar política…"
        isLoading={list.isLoading}
        errorMessage={list.isError ? 'Error cargando políticas.' : undefined}
        emptyMessage="No hay políticas todavía."
      />

      <CompanyPolicyFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(payload) => createMut.mutateAsync(payload)}
        submitting={createMut.isPending}
      />
    </div>
  );
};
