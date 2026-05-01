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
import type { CreateIncidentPayload } from '../../types/approvals';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSubmit: (payload: CreateIncidentPayload) => Promise<unknown>;
  submitting?: boolean;
}

const isValidUrl = (value: string): boolean => {
  try {
    // Constructor lanza si la URL es inválida.
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * CreateIncidentDialog — alta manual de un incident. Pensado para
 * registro retroactivo o testing — el path principal es WhatsApp donde
 * el empleado manda foto y el OCR pipeline auto-valida.
 */
export const CreateIncidentDialog = ({
  open,
  onOpenChange,
  employees,
  onSubmit,
  submitting,
}: Props) => {
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState('');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmployeeId('');
    setMessage('');
    setMediaUrl('');
    setError(null);
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!employeeId) {
      setError(t('approvals:incident.dialog.errors.required'));
      return;
    }
    const trimmedMessage = message.trim();
    const trimmedMedia = mediaUrl.trim();
    if (!trimmedMessage && !trimmedMedia) {
      setError(t('approvals:incident.dialog.errors.messageOrMedia'));
      return;
    }
    if (trimmedMedia && !isValidUrl(trimmedMedia)) {
      setError(t('approvals:incident.dialog.errors.invalidUrl'));
      return;
    }
    try {
      await onSubmit({
        employeeId,
        message: trimmedMessage || undefined,
        mediaUrl: trimmedMedia || undefined,
      });
    } catch (err) {
      setError(describeApiError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('approvals:incident.dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('approvals:incident.dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="inc-employee">
              {t('approvals:incident.dialog.fields.employee')}
            </Label>
            <select
              id="inc-employee"
              data-testid="inc-employee-select"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={submitting}
              required
              className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
            >
              <option value="">
                {t('approvals:incident.dialog.fields.employeePick')}
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="inc-message">
              {t('approvals:incident.dialog.fields.message')}
            </Label>
            <Textarea
              id="inc-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('approvals:incident.dialog.fields.messagePlaceholder')}
              data-testid="inc-message-input"
              disabled={submitting}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inc-media">
              {t('approvals:incident.dialog.fields.mediaUrl')}{' '}
              <span className="text-muted-foreground">
                {t('approvals:incident.dialog.fields.mediaUrlHint')}
              </span>
            </Label>
            <Input
              id="inc-media"
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder={t('approvals:incident.dialog.fields.mediaUrlPlaceholder')}
              data-testid="inc-media-input"
              disabled={submitting}
            />
          </div>
          {error && (
            <p className="text-sm text-error" data-testid="inc-form-error">
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
              {t('approvals:incident.dialog.actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              data-testid="inc-submit"
            >
              {submitting
                ? t('approvals:incident.dialog.actions.submitting')
                : t('approvals:incident.dialog.actions.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
