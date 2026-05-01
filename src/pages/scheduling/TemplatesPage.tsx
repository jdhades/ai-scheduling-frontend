import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useShiftTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  type ShiftTemplate,
} from '../../api/shift-templates.api';
import { useCompanySkillsQuery } from '../../api/company-skills.api';
import { useDepartmentsQuery } from '../../api/scope-targets.api';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import {
  TemplateFormDialog,
  toCreatePayload,
  toUpdatePayload,
  type TemplateFormValues,
} from './TemplateFormDialog';

const fmtTime = (t: string) => t.slice(0, 5);

/**
 * TemplatesPage — listado, alta y edición de shift templates del tenant.
 * Soft delete; PATCH disponible para corregir cualquier campo (incluida la
 * skill requerida).
 */
export const TemplatesPage = () => {
  const { t } = useTranslation();
  const dayLabel = (d: number | null): string =>
    d === null ? t('templates:values.allDays') : t(`templates:days.${d}`);
  const templates = useShiftTemplatesQuery();
  const skills = useCompanySkillsQuery();
  const departmentsQ = useDepartmentsQuery();
  const createMut = useCreateTemplateMutation();
  const updateMut = useUpdateTemplateMutation();
  const deleteMut = useDeleteTemplateMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOf, setEditOf] = useState<ShiftTemplate | null>(null);

  const rows = templates.data ?? [];
  const departments = departmentsQ.data ?? [];
  const showDeptColumn = departments.length > 1;

  const skillById = useMemo(
    () => new Map((skills.data ?? []).map((s) => [s.id, s.name] as const)),
    [skills.data],
  );

  const departmentNameById = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name] as const)),
    [departments],
  );

  const handleCreate = async (values: TemplateFormValues) => {
    await createMut.mutateAsync(toCreatePayload(values));
    setCreateOpen(false);
  };

  const handleEdit = async (values: TemplateFormValues) => {
    if (!editOf) return;
    await updateMut.mutateAsync({ id: editOf.id, patch: toUpdatePayload(values) });
    setEditOf(null);
  };

  const columns = useMemo<ColumnDef<ShiftTemplate>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('templates:table.name'),
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'dayOfWeek',
        header: t('templates:table.day'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {dayLabel(row.original.dayOfWeek)}
          </span>
        ),
      },
      {
        accessorKey: 'startTime',
        header: t('templates:table.schedule'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {fmtTime(row.original.startTime)}–{fmtTime(row.original.endTime)}
          </span>
        ),
      },
      {
        id: 'skill',
        header: t('templates:table.skill'),
        // accessorFn → search/sort por nombre resuelto, no por UUID.
        accessorFn: (template) =>
          template.requiredSkillId
            ? skillById.get(template.requiredSkillId) ?? template.requiredSkillId
            : '',
        enableGlobalFilter: true,
        cell: ({ row }) =>
          row.original.requiredSkillId ? (
            <span className="text-muted-foreground">
              {skillById.get(row.original.requiredSkillId) ??
                row.original.requiredSkillId.slice(0, 8) + '…'}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      ...(showDeptColumn
        ? ([
            {
              id: 'department',
              header: t('templates:table.department'),
              accessorFn: (template) =>
                template.departmentId
                  ? departmentNameById.get(template.departmentId) ?? ''
                  : '',
              cell: ({ row }) => {
                const id = row.original.departmentId;
                return id ? (
                  <span className="text-muted-foreground">
                    {departmentNameById.get(id) ?? id.slice(0, 8)}
                  </span>
                ) : (
                  <span className="text-xs italic text-muted-foreground">
                    {t('templates:values.departmentNone')}
                  </span>
                );
              },
            },
          ] as ColumnDef<ShiftTemplate>[])
        : []),
      {
        accessorKey: 'requiredEmployees',
        header: t('templates:table.requiredEmployees'),
        cell: ({ row }) =>
          row.original.requiredEmployees === null ? (
            <span className="text-secondary">
              {t('templates:values.elastic')}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {row.original.requiredEmployees}
            </span>
          ),
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">{t('templates:table.actions')}</span>
        ),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const template = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                title={t('templates:rowActions.edit')}
                data-testid={`edit-${template.id}`}
                onClick={() => setEditOf(template)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t('templates:rowActions.delete')}
                data-testid={`delete-${template.id}`}
                disabled={deleteMut.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      t('templates:rowActions.deleteConfirm', {
                        name: template.name,
                      }),
                    )
                  ) {
                    deleteMut.mutate(template.id);
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
    [t, dayLabel, skillById, departmentNameById, showDeptColumn, deleteMut],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('templates:page.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {templates.isLoading
              ? t('templates:page.summaryLoading')
              : t('templates:page.summaryCount', { count: rows.length })}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="new-template-btn">
          <Plus className="h-4 w-4" /> {t('templates:page.newButton')}
        </Button>
      </header>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(template) => template.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder={t('templates:page.searchPlaceholder')}
        isLoading={templates.isLoading}
        errorMessage={
          templates.isError ? t('templates:page.loadError') : undefined
        }
        emptyMessage={t('templates:page.empty')}
      />

      <TemplateFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        submitting={createMut.isPending}
      />
      <TemplateFormDialog
        open={!!editOf}
        onOpenChange={(o) => !o && setEditOf(null)}
        initial={editOf}
        onSubmit={handleEdit}
        submitting={updateMut.isPending}
      />
    </div>
  );
};
