import { useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, FileEdit } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useSemanticRulesQuery,
  useCreateSemanticRuleMutation,
  useUpdateSemanticRuleMetadataMutation,
  useUpdateSemanticRuleTextMutation,
  useDeleteSemanticRuleMutation,
} from '../../api/semantic-rules.api';
import type {
  SemanticRuleListItem,
  RulePriority,
} from '../../types/semantic-rule';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Badge } from '../../components/ui/Badge';
import { CreateRuleDialog } from './CreateRuleDialog';
import { EditRuleMetadataDialog } from './EditRuleMetadataDialog';
import { EditRuleTextDialog } from './EditRuleTextDialog';

const PRIORITY_LABEL: Record<RulePriority, string> = {
  1: 'Legal',
  2: 'Hard',
  3: 'Soft',
};

/**
 * RulesPage — listado de reglas semánticas del tenant.
 *
 * Tres acciones de edit dispuestas:
 *  - PATCH metadata (priority, isActive, expiresAt) → barato
 *  - PATCH text → caro (regenera embedding + structure vía LLM); confirm
 *  - DELETE → soft delete
 */
export const RulesPage = () => {
  const list = useSemanticRulesQuery();
  const createMut = useCreateSemanticRuleMutation();
  const updateMetaMut = useUpdateSemanticRuleMetadataMutation();
  const updateTextMut = useUpdateSemanticRuleTextMutation();
  const deleteMut = useDeleteSemanticRuleMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editMetaOf, setEditMetaOf] = useState<SemanticRuleListItem | null>(null);
  const [editTextOf, setEditTextOf] = useState<SemanticRuleListItem | null>(null);

  const rows = list.data ?? [];

  const columns = useMemo<ColumnDef<SemanticRuleListItem>[]>(
    () => [
      {
        accessorKey: 'ruleText',
        header: 'Texto',
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span
            className="block max-w-md truncate font-medium"
            title={row.original.ruleText}
          >
            {row.original.ruleText}
          </span>
        ),
      },
      {
        accessorKey: 'priorityLevel',
        header: 'Prioridad',
        // Sort numérico (1/2/3); mostramos label.
        cell: ({ row }) => (
          <Badge>{PRIORITY_LABEL[row.original.priorityLevel]}</Badge>
        ),
      },
      {
        accessorKey: 'ruleType',
        header: 'Tipo',
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.ruleType}</span>
        ),
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
        accessorKey: 'expiresAt',
        header: 'Vence',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.expiresAt ? row.original.expiresAt.slice(0, 10) : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                title="Editar metadata"
                data-testid={`edit-meta-${r.id}`}
                onClick={() => setEditMetaOf(r)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Editar texto (re-procesa con IA)"
                data-testid={`edit-text-${r.id}`}
                onClick={() => setEditTextOf(r)}
              >
                <FileEdit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Eliminar"
                data-testid={`delete-${r.id}`}
                disabled={deleteMut.isPending}
                onClick={() => {
                  if (window.confirm('¿Eliminar esta regla?')) {
                    deleteMut.mutate(r.id);
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
          <h1 className="text-xl font-bold text-foreground">Reglas semánticas</h1>
          <p className="text-sm text-muted-foreground">
            {list.isLoading
              ? 'Cargando…'
              : `${rows.length} regla${rows.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="new-rule-btn">
          <Plus className="h-4 w-4" /> Nueva
        </Button>
      </header>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder="Buscar por texto o tipo…"
        isLoading={list.isLoading}
        errorMessage={list.isError ? 'Error cargando reglas.' : undefined}
        emptyMessage="No hay reglas todavía."
      />

      <CreateRuleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(p) => createMut.mutateAsync(p).then(() => setCreateOpen(false))}
        submitting={createMut.isPending}
      />
      <EditRuleMetadataDialog
        rule={editMetaOf}
        onOpenChange={(o) => !o && setEditMetaOf(null)}
        onSubmit={(patch) =>
          editMetaOf
            ? updateMetaMut
                .mutateAsync({ id: editMetaOf.id, patch })
                .then(() => setEditMetaOf(null))
            : Promise.resolve()
        }
        submitting={updateMetaMut.isPending}
      />
      <EditRuleTextDialog
        rule={editTextOf}
        onOpenChange={(o) => !o && setEditTextOf(null)}
        onSubmit={(payload) =>
          editTextOf
            ? updateTextMut
                .mutateAsync({ id: editTextOf.id, payload })
                .then(() => setEditTextOf(null))
            : Promise.resolve()
        }
        submitting={updateTextMut.isPending}
      />
    </div>
  );
};
