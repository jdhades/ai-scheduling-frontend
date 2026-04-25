import { useState, type FormEvent } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  useShiftTemplatesQuery,
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
  type CreateShiftTemplatePayload,
  type ShiftTemplate,
} from '../../api/shift-templates.api';
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

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const dayLabel = (d: number | null) => (d === null ? 'Todos' : DAY_LABELS[d]);

const fmtTime = (t: string) => t.slice(0, 5); // "HH:MM:SS" → "HH:MM"

const EMPTY_FORM: CreateShiftTemplatePayload = {
  name: '',
  dayOfWeek: null,
  startTime: '08:00',
  endTime: '16:00',
  requiredEmployees: null,
};

/**
 * TemplatesPage — listado y creación de shift templates del tenant.
 * Soft delete; sin PATCH inline (eso queda para una iteración futura).
 */
export const TemplatesPage = () => {
  const templates = useShiftTemplatesQuery();
  const createMut = useCreateTemplateMutation();
  const deleteMut = useDeleteTemplateMutation();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const rows = templates.data ?? [];

  const reset = () => {
    setForm(EMPTY_FORM);
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.startTime || !form.endTime) {
      setError('Nombre, hora inicio y hora fin son obligatorios.');
      return;
    }
    try {
      await createMut.mutateAsync(form);
      reset();
      setOpen(false);
    } catch (err) {
      setError((err as Error).message ?? 'Error al crear template.');
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Shift Templates</h1>
          <p className="text-sm text-muted-foreground">
            {templates.isLoading
              ? 'Cargando…'
              : `${rows.length} template${rows.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="new-template-btn">
          <Plus className="w-4 h-4" /> Nuevo
        </Button>
      </header>

      {templates.isError && (
        <div className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          Error cargando templates.
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-surface-low">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Día</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>required_employees</TableHead>
              <TableHead className="w-20 text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Cargando…
                </TableCell>
              </TableRow>
            )}
            {!templates.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay templates todavía.
                </TableCell>
              </TableRow>
            )}
            {rows.map((t: ShiftTemplate) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {dayLabel(t.dayOfWeek)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {fmtTime(t.startTime)}–{fmtTime(t.endTime)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t.requiredEmployees === null ? (
                    <span className="text-secondary">elastic</span>
                  ) : (
                    t.requiredEmployees
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Eliminar"
                    data-testid={`delete-${t.id}`}
                    disabled={deleteMut.isPending}
                    onClick={() => {
                      if (window.confirm(`¿Eliminar el template "${t.name}"?`)) {
                        deleteMut.mutate(t.id);
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
          if (!o) reset();
          setOpen(o);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo template</DialogTitle>
            <DialogDescription>
              Define un turno recurrente. Si dejás "required_employees" vacío, el
              slot es ELASTIC y absorbe sobrante.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="t-name">Nombre</Label>
              <Input
                id="t-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ej. Turno Diurno"
                data-testid="t-name-input"
                disabled={createMut.isPending}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-day">Día (vacío = todos)</Label>
              <select
                id="t-day"
                data-testid="t-day-select"
                value={form.dayOfWeek === null ? '' : form.dayOfWeek}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    dayOfWeek: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
                disabled={createMut.isPending}
                className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
              >
                <option value="">Todos</option>
                {DAY_LABELS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="t-start">Inicio</Label>
                <Input
                  id="t-start"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  data-testid="t-start-input"
                  disabled={createMut.isPending}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-end">Fin</Label>
                <Input
                  id="t-end"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  data-testid="t-end-input"
                  disabled={createMut.isPending}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-required">required_employees (vacío = elastic)</Label>
              <Input
                id="t-required"
                type="number"
                min={0}
                value={form.requiredEmployees ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    requiredEmployees: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
                data-testid="t-required-input"
                disabled={createMut.isPending}
              />
            </div>
            {error && (
              <p className="text-sm text-error" data-testid="t-form-error">
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
                data-testid="t-submit"
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
