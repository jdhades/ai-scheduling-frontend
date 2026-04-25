import { useEffect, useState, type FormEvent } from 'react';
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

export interface EmployeeFormValues {
  name: string;
  phone: string;
  experienceMonths: number;
  externalId?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si llega, el dialog opera en modo edición. */
  initial?: Employee | null;
  /** Resuelve después del request. Si rechaza, el dialog queda abierto. */
  onSubmit: (values: EmployeeFormValues) => Promise<unknown>;
  submitting?: boolean;
}

const EMPTY: EmployeeFormValues = { name: '', phone: '', experienceMonths: 0, externalId: '' };

/**
 * Dialog único de alta/edición de empleado. El UUID interno lo gestiona el
 * backend — el manager solo ve `name`, `phone`, `experienceMonths` y el
 * `externalId` opcional (legajo / id de su sistema de nómina).
 */
export const EmployeeFormDialog = ({
  open,
  onOpenChange,
  initial,
  onSubmit,
  submitting,
}: Props) => {
  const isEdit = !!initial;
  const [values, setValues] = useState<EmployeeFormValues>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(
      initial
        ? {
            name: initial.name ?? '',
            phone: initial.phone ?? '',
            experienceMonths: initial.experienceMonths ?? 0,
            externalId: initial.externalId ?? '',
          }
        : EMPTY,
    );
    setError(null);
  }, [open, initial]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!values.name.trim() || !values.phone.trim() || Number.isNaN(values.experienceMonths)) {
      setError('Nombre, teléfono y experiencia son obligatorios.');
      return;
    }
    try {
      await onSubmit({
        name: values.name.trim(),
        phone: values.phone.trim(),
        experienceMonths: values.experienceMonths,
        externalId: values.externalId?.trim() || undefined,
      });
    } catch (err) {
      setError((err as Error).message ?? 'Error al guardar empleado.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Cambia los datos visibles. El identificador interno no se modifica.'
              : 'Crea un empleado en el tenant actual. El identificador interno lo asigna el sistema.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="employee-name">Nombre</Label>
            <Input
              id="employee-name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="ej. Sofía López"
              data-testid="employee-name-input"
              disabled={submitting}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="employee-phone">Teléfono (E.164)</Label>
            <Input
              id="employee-phone"
              value={values.phone}
              onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
              placeholder="+5491123456789"
              data-testid="employee-phone-input"
              disabled={submitting}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="employee-exp">Meses de experiencia</Label>
            <Input
              id="employee-exp"
              type="number"
              min={0}
              value={values.experienceMonths}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  experienceMonths: Number.parseInt(e.target.value, 10) || 0,
                }))
              }
              data-testid="employee-exp-input"
              disabled={submitting}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="employee-external-id">
              ID externo <span className="text-muted-foreground">(opcional · legajo / nómina)</span>
            </Label>
            <Input
              id="employee-external-id"
              value={values.externalId ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, externalId: e.target.value }))}
              placeholder="ej. legajo-001"
              data-testid="employee-external-id-input"
              disabled={submitting}
              maxLength={64}
            />
          </div>
          {error && (
            <p className="text-sm text-error" data-testid="employee-form-error">
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
            <Button type="submit" disabled={submitting} data-testid="employee-submit">
              {submitting ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
