import { useState, type FormEvent } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  useCompanySkillsQuery,
  useCreateCompanySkillMutation,
  useDeleteCompanySkillMutation,
} from '../../api/company-skills.api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
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
          <Plus className="w-4 h-4" /> Nueva
        </Button>
      </header>

      {skills.isError && (
        <div className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          Error cargando skills.
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-surface-low">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-20 text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skills.isLoading && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Cargando…
                </TableCell>
              </TableRow>
            )}
            {!skills.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  No hay skills todavía.
                </TableCell>
              </TableRow>
            )}
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-right">
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
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
