import { useState, type FormEvent } from 'react';
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
import type { CreateEmployeePayload } from '../../types/employee';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Resuelve después del POST y de cualquier cleanup. Si rechaza, el dialog
   * permanece abierto.
   */
  onSubmit: (payload: CreateEmployeePayload) => Promise<unknown>;
  submitting?: boolean;
}

/**
 * Dialog de creación de empleado. UI mínima — el manager completa los 3
 * campos que el backend acepta hoy en POST /employees: id externo, phone
 * y meses de experiencia.
 */
export const EmployeeFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: Props) => {
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceMonths, setExperienceMonths] = useState('0');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEmployeeId('');
    setPhone('');
    setExperienceMonths('0');
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const months = Number.parseInt(experienceMonths, 10);
    if (!employeeId.trim() || !phone.trim() || Number.isNaN(months)) {
      setError('Completá los 3 campos.');
      return;
    }
    try {
      await onSubmit({ employeeId: employeeId.trim(), phone: phone.trim(), experienceMonths: months });
      reset();
    } catch (err) {
      setError((err as Error).message ?? 'Error al crear empleado.');
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
          <DialogTitle>Nuevo empleado</DialogTitle>
          <DialogDescription>
            Crea un empleado en el tenant actual. El id externo no se cambia
            después.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="employee-id">ID externo</Label>
            <Input
              id="employee-id"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="ej. legajo-001"
              data-testid="employee-id-input"
              disabled={submitting}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="employee-phone">Teléfono (E.164)</Label>
            <Input
              id="employee-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              value={experienceMonths}
              onChange={(e) => setExperienceMonths(e.target.value)}
              data-testid="employee-exp-input"
              disabled={submitting}
              required
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
              {submitting ? 'Guardando…' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
