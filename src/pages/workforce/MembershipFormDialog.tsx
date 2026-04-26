import { useState, type FormEvent } from 'react';
import { describeApiError } from '../../lib/api-error';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import type { Employee } from '../../types/employee';
import type { ShiftTemplate } from '../../api/shift-templates.api';
import type { CreateShiftMembershipPayload } from '../../types/shift-membership';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  templates: ShiftTemplate[];
  onSubmit: (payload: CreateShiftMembershipPayload) => Promise<unknown>;
  submitting?: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Dialog de creación de membership. Selectores nativos (no Radix Select
 * todavía — eso queda para una iteración cuando agreguemos ese primitive).
 */
export const MembershipFormDialog = ({
  open,
  onOpenChange,
  employees,
  templates,
  onSubmit,
  submitting,
}: Props) => {
  const [employeeId, setEmployeeId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(today());
  const [effectiveUntil, setEffectiveUntil] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEmployeeId('');
    setTemplateId('');
    setEffectiveFrom(today());
    setEffectiveUntil('');
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!employeeId || !templateId || !effectiveFrom) {
      setError('Empleado, template y fecha "desde" son obligatorios.');
      return;
    }
    if (effectiveUntil && effectiveUntil < effectiveFrom) {
      setError('"Hasta" debe ser igual o posterior a "Desde".');
      return;
    }
    try {
      await onSubmit({
        employeeId,
        templateId,
        effectiveFrom,
        effectiveUntil: effectiveUntil || null,
      });
      reset();
    } catch (err) {
      setError(describeApiError(err));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo membership</DialogTitle>
          <DialogDescription>
            Vincula un empleado a un shift template. Para cambiar luego:
            eliminar y crear de nuevo (mantiene el histórico limpio).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="m-employee">Empleado</Label>
            <select
              id="m-employee"
              data-testid="m-employee-select"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={submitting}
              required
              className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
            >
              <option value="">Elegí un empleado…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="m-template">Template</Label>
            <select
              id="m-template"
              data-testid="m-template-select"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              disabled={submitting}
              required
              className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
            >
              <option value="">Elegí un template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="m-from">Desde</Label>
              <Input
                id="m-from"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                data-testid="m-from-input"
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-until">Hasta (opcional)</Label>
              <Input
                id="m-until"
                type="date"
                value={effectiveUntil}
                onChange={(e) => setEffectiveUntil(e.target.value)}
                data-testid="m-until-input"
                disabled={submitting}
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-error" data-testid="m-form-error">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} data-testid="m-submit">
              {submitting ? 'Guardando…' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
