import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import type { Employee } from '../../types/employee';
import type { CreateDayOffRequestPayload } from '../../types/approvals';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSubmit: (payload: CreateDayOffRequestPayload) => Promise<unknown>;
  submitting?: boolean;
}

const todayISO = (): string => new Date().toISOString().slice(0, 10);

/**
 * CreateDayOffRequestDialog — alta manual de un pedido de día libre.
 * Útil cuando el empleado lo pidió verbalmente / por otro canal y el
 * manager quiere registrarlo en el panel para tracking.
 */
export const CreateDayOffRequestDialog = ({
  open,
  onOpenChange,
  employees,
  onSubmit,
  submitting,
}: Props) => {
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmployeeId('');
    setDate(todayISO());
    setReason('');
    setError(null);
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!employeeId || !date || !reason.trim()) {
      setError(t('approvals:dayOff.dialog.errors.required'));
      return;
    }
    if (date < todayISO()) {
      setError(t('approvals:dayOff.dialog.errors.datePast'));
      return;
    }
    try {
      await onSubmit({
        employeeId,
        date,
        reason: reason.trim(),
      });
    } catch (err) {
      setError(describeApiError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('approvals:dayOff.dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('approvals:dayOff.dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="do-employee">
              {t('approvals:dayOff.dialog.fields.employee')}
            </Label>
            <select
              id="do-employee"
              data-testid="do-employee-select"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={submitting}
              required
              className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
            >
              <option value="">
                {t('approvals:dayOff.dialog.fields.employeePick')}
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="do-date">
              {t('approvals:dayOff.dialog.fields.date')}
            </Label>
            <Input
              id="do-date"
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              data-testid="do-date-input"
              disabled={submitting}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="do-reason">
              {t('approvals:dayOff.dialog.fields.reason')}
            </Label>
            <Textarea
              id="do-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('approvals:dayOff.dialog.fields.reasonPlaceholder')}
              data-testid="do-reason-input"
              disabled={submitting}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-error" data-testid="do-form-error">
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
              {t('approvals:dayOff.dialog.actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              data-testid="do-submit"
            >
              {submitting
                ? t('approvals:dayOff.dialog.actions.submitting')
                : t('approvals:dayOff.dialog.actions.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
