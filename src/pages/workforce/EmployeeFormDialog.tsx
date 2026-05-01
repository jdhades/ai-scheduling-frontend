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
  const { t } = useTranslation();
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
      setError(t('workforce:employees.dialog.errors.required'));
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
      setError(describeApiError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('workforce:employees.dialog.titleEdit')
              : t('workforce:employees.dialog.titleNew')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('workforce:employees.dialog.descriptionEdit')
              : t('workforce:employees.dialog.descriptionNew')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="employee-name">
              {t('workforce:employees.dialog.fields.name')}
            </Label>
            <Input
              id="employee-name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder={t('workforce:employees.dialog.fields.namePlaceholder')}
              data-testid="employee-name-input"
              disabled={submitting}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="employee-phone">
              {t('workforce:employees.dialog.fields.phone')}
            </Label>
            <Input
              id="employee-phone"
              value={values.phone}
              onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
              placeholder={t('workforce:employees.dialog.fields.phonePlaceholder')}
              data-testid="employee-phone-input"
              disabled={submitting}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="employee-exp">
              {t('workforce:employees.dialog.fields.experience')}
            </Label>
            <Input
              id="employee-exp"
              type="number"
              min={0}
              value={values.experienceMonths === 0 ? '' : values.experienceMonths}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  experienceMonths:
                    e.target.value === '' ? 0 : Number.parseInt(e.target.value, 10) || 0,
                }))
              }
              placeholder={t('workforce:employees.dialog.fields.experiencePlaceholder')}
              data-testid="employee-exp-input"
              disabled={submitting}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="employee-external-id">
              {t('workforce:employees.dialog.fields.externalId')}{' '}
              <span className="text-muted-foreground">
                {t('workforce:employees.dialog.fields.externalIdHint')}
              </span>
            </Label>
            <Input
              id="employee-external-id"
              value={values.externalId ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, externalId: e.target.value }))}
              placeholder={t('workforce:employees.dialog.fields.externalIdPlaceholder')}
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
              {t('workforce:employees.dialog.actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting} data-testid="employee-submit">
              {submitting
                ? t('workforce:employees.dialog.actions.submitting')
                : isEdit
                  ? t('workforce:employees.dialog.actions.submitEdit')
                  : t('workforce:employees.dialog.actions.submitCreate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
