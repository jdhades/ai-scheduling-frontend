import { useMemo, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useCompanySkillsQuery,
  useCreateCompanySkillMutation,
  useDeleteCompanySkillMutation,
} from '../../api/company-skills.api';
import type { CompanySkill } from '../../types/company-skill';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DataTable } from '../../components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

/**
 * SkillsPage — catálogo de skills del tenant. Sin PATCH (renombrar
 * afectaría a otras empresas que usan la misma skill global; el backend
 * lo bloquea).
 */
export const SkillsPage = () => {
  const skills = useCompanySkillsQuery();
  const createMut = useCreateCompanySkillMutation();
  const deleteMut = useDeleteCompanySkillMutation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const rows = skills.data ?? [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }
    try {
      await createMut.mutateAsync({ name: name.trim() });
      setName('');
      setOpen(false);
    } catch (err) {
      setError((err as Error).message ?? 'Error al crear skill.');
    }
  };

  const columns = useMemo<ColumnDef<CompanySkill>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <Button
              variant="ghost"
              size="icon"
              title="Eliminar"
              data-testid={`delete-${s.id}`}
              disabled={deleteMut.isPending}
              onClick={() => {
                if (window.confirm(`¿Eliminar la skill "${s.name}"?`)) {
                  deleteMut.mutate(s.id);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          );
        },
        meta: { headerClassName: 'w-20', cellClassName: 'text-right' },
      },
    ],
    [deleteMut],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Catálogo de skills</h1>
          <p className="text-sm text-muted-foreground">
            {skills.isLoading
              ? 'Cargando…'
              : `${rows.length} skill${rows.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="new-skill-btn">
          <Plus className="h-4 w-4" /> Nueva
        </Button>
      </header>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(s) => s.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder="Buscar skill…"
        isLoading={skills.isLoading}
        errorMessage={skills.isError ? 'Error cargando skills.' : undefined}
        emptyMessage="No hay skills todavía."
      />

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setName('');
            setError(null);
          }
          setOpen(o);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva skill</DialogTitle>
            <DialogDescription>
              Agrega una skill al catálogo del tenant. Si el nombre ya
              existe en el catálogo global, se reutiliza.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="skill-name">Nombre</Label>
              <Input
                id="skill-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. barista"
                data-testid="skill-name-input"
                disabled={createMut.isPending}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-error" data-testid="skill-form-error">
                {error}
              </p>
            )}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createMut.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMut.isPending}
                data-testid="skill-submit"
              >
                {createMut.isPending ? 'Guardando…' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
