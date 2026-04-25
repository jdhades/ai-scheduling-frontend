import { useState } from 'react';
import { Plus, Trash2, Loader2, Pencil, FileEdit } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
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
          <Plus className="w-4 h-4" /> Nueva
        </Button>
      </header>

      {list.isError && (
        <div className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          Error cargando reglas.
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-surface-low">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Texto</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Activa</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead className="w-32 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Cargando…
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay reglas todavía.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium max-w-md truncate" title={r.ruleText}>
                  {r.ruleText}
                </TableCell>
                <TableCell>
                  <Badge>{PRIORITY_LABEL[r.priorityLevel]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.ruleType}</TableCell>
                <TableCell className="text-muted-foreground">
                  {r.isActive ? 'sí' : 'no'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.expiresAt ? r.expiresAt.slice(0, 10) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar metadata"
                      data-testid={`edit-meta-${r.id}`}
                      onClick={() => setEditMetaOf(r)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar texto (re-procesa con IA)"
                      data-testid={`edit-text-${r.id}`}
                      onClick={() => setEditTextOf(r)}
                    >
                      <FileEdit className="w-3.5 h-3.5" />
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
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
