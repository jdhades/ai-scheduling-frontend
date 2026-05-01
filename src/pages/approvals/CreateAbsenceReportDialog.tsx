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
import type { CreateAbsenceReportPayload } from '../../types/approvals';

const todayISO = (): string => new Date().toISOString().slice(0, 10);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSubmit: (payload: CreateAbsenceReportPayload) => Promise<unknown>;
  submitting?: boolean;
}

/**
 * CreateAbsenceReportDialog — alta manual de un reporte de ausencia.
 * Pensado para el caso en que el empleado avisó por teléfono / mail / en
 * persona y el manager registra el evento en el panel. El path principal
 * (WhatsApp) sigue creando reportes desde el bot.
 */
export const CreateAbsenceReportDialog = ({
  open,
  onOpenChange,
  employees,
  onSubmit,
  submitting,
}: Props) => {
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState('');
  const [reason, setReason] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const today = todayISO();
    setEmployeeId('');
    setReason('');
    setIsUrgent(false);
    setStartDate(today);
    setEndDate(today);
    setError(null);
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!employeeId || !reason.trim() || !startDate || !endDate) {
      setError(t('approvals:absence.dialog.errors.required'));
      return;
    }
    if (endDate < startDate) {
      setError(t('approvals:absence.dialog.errors.endBeforeStart'));
      return;
    }
    try {
      await onSubmit({
        employeeId,
        reason: reason.trim(),
        isUrgent,
        startDate,
        endDate,
      });
    } catch (err) {
      setError(describeApiError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('approvals:absence.dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('approvals:absence.dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="abs-employee">
              {t('approvals:absence.dialog.fields.employee')}
            </Label>
            <select
              id="abs-employee"
              data-testid="abs-employee-select"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={submitting}
              required
              className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
            >
              <option value="">
                {t('approvals:absence.dialog.fields.employeePick')}
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="abs-start-date">
                {t('approvals:absence.dialog.fields.startDate')}
              </Label>
              <Input
                id="abs-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  const next = e.target.value;
                  setStartDate(next);
                  if (endDate < next) setEndDate(next);
                }}
                data-testid="abs-start-date-input"
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="abs-end-date">
                {t('approvals:absence.dialog.fields.endDate')}
              </Label>
              <Input
                id="abs-end-date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="abs-end-date-input"
                disabled={submitting}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="abs-reason">
              {t('approvals:absence.dialog.fields.reason')}
            </Label>
            <Textarea
              id="abs-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('approvals:absence.dialog.fields.reasonPlaceholder')}
              data-testid="abs-reason-input"
              disabled={submitting}
              required
            />
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              id="abs-urgent"
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              disabled={submitting}
              data-testid="abs-urgent-cb"
              className="mt-0.5 rounded border-white/20"
            />
            <div className="space-y-0.5">
              <span className="block text-sm font-medium text-foreground">
                {t('approvals:absence.dialog.fields.urgent')}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t('approvals:absence.dialog.fields.urgentHint')}
              </span>
            </div>
          </label>
          {error && (
            <p className="text-sm text-error" data-testid="abs-form-error">
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
              {t('approvals:absence.dialog.actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              data-testid="abs-submit"
            >
              {submitting
                ? t('approvals:absence.dialog.actions.submitting')
                : t('approvals:absence.dialog.actions.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
