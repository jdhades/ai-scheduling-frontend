import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Pencil, FileEdit, AlertTriangle, Sparkles } from 'lucide-react';
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
} from '../../types/semantic-rule';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Badge } from '../../components/ui/Badge';
import { CreateRuleDialog } from './CreateRuleDialog';
import { EditRuleMetadataDialog } from './EditRuleMetadataDialog';
import { EditRuleTextDialog } from './EditRuleTextDialog';

/**
 * RulesPage — listado de reglas semánticas del tenant.
 *
 * Tres acciones de edit dispuestas:
 *  - PATCH metadata (priority, isActive, expiresAt) → barato
 *  - PATCH text → caro (regenera embedding + structure vía LLM); confirm
 *  - DELETE → soft delete
 */
export const RulesPage = () => {
  const { t } = useTranslation();
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
        header: t('rules:table.text'),
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
        header: t('rules:table.priority'),
        cell: ({ row }) => (
          <Badge>{t(`rules:priority.${row.original.priorityLevel}`)}</Badge>
        ),
      },
      {
        id: 'ai',
        header: t('rules:table.ai'),
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (!r.hasStructure) {
            return (
              <span
                className="inline-flex items-center gap-1 text-error"
                title={t('rules:ai.noStructureTooltip')}
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs">{t('rules:ai.noStructure')}</span>
              </span>
            );
          }
          if (!r.hasEmbedding) {
            return (
              <span
                className="inline-flex items-center gap-1 text-muted-foreground"
                title={t('rules:ai.noEmbeddingTooltip')}
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs">{t('rules:ai.noEmbedding')}</span>
              </span>
            );
          }
          return (
            <span
              className="inline-flex items-center gap-1 text-primary"
              title={t('rules:ai.okTooltip')}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">{t('rules:ai.ok')}</span>
            </span>
          );
        },
      },
      {
        accessorKey: 'ruleType',
        header: t('rules:table.type'),
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.ruleType}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('rules:table.active'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.isActive ? t('rules:yesShort') : t('rules:noShort')}
          </span>
        ),
      },
      {
        accessorKey: 'expiresAt',
        header: t('rules:table.expires'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.expiresAt ? row.original.expiresAt.slice(0, 10) : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('rules:table.actions')}</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                title={t('rules:rowActions.editMetadata')}
                data-testid={`edit-meta-${r.id}`}
                onClick={() => setEditMetaOf(r)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t('rules:rowActions.editText')}
                data-testid={`edit-text-${r.id}`}
                onClick={() => setEditTextOf(r)}
              >
                <FileEdit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t('rules:rowActions.delete')}
                data-testid={`delete-${r.id}`}
                disabled={deleteMut.isPending}
                onClick={() => {
                  if (window.confirm(t('rules:rowActions.deleteConfirm'))) {
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
    [t, deleteMut],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('rules:page.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {list.isLoading
              ? t('rules:page.summaryLoading')
              : t('rules:page.summaryCount', { count: rows.length })}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="new-rule-btn">
          <Plus className="h-4 w-4" /> {t('rules:page.newButton')}
        </Button>
      </header>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder={t('rules:page.searchPlaceholder')}
        isLoading={list.isLoading}
        errorMessage={list.isError ? t('rules:page.loadError') : undefined}
        emptyMessage={t('rules:page.empty')}
      />

      <CreateRuleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(p) => createMut.mutateAsync(p)}
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
