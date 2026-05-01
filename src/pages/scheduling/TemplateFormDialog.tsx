import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useCompanySkillsQuery } from '../../api/company-skills.api';
import { useDepartmentsQuery } from '../../api/scope-targets.api';
import type {
  CreateShiftTemplatePayload,
  ShiftTemplate,
  UpdateShiftTemplatePayload,
} from '../../api/shift-templates.api';

export interface TemplateFormValues {
  name: string;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  requiredEmployees: number | null;
  requiredSkillId: string | null;
  departmentId: string | null;
}

const EMPTY: TemplateFormValues = {
  name: '',
  dayOfWeek: null,
  startTime: '08:00',
  endTime: '16:00',
  requiredEmployees: null,
  requiredSkillId: null,
  departmentId: null,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si llega, el dialog opera en modo edición. */
  initial?: ShiftTemplate | null;
  /**
   * Resuelve después del request. Si rechaza, el dialog queda abierto.
   * Recibe el shape genérico — el caller lo mapea a Create vs Update.
   */
  onSubmit: (values: TemplateFormValues) => Promise<unknown>;
  submitting?: boolean;
}

const fmtHHMM = (t: string) => t.slice(0, 5);

/**
 * Dialog único de alta/edición de shift template. La skill es opcional;
 * si la elegís, el scheduler restringe la asignación a empleados que la
 * tengan.
 */
export const TemplateFormDialog = ({
  open,
  onOpenChange,
  initial,
  onSubmit,
  submitting,
}: Props) => {
  const { t } = useTranslation();
  const skills = useCompanySkillsQuery();
  const departmentsQ = useDepartmentsQuery();
  const departments = departmentsQ.data ?? [];
  // Smart-skip: si la empresa tiene 0 ó 1 departamentos, ocultamos el
  // selector — un solo departamento implica que todos los templates
  // pertenecen a él, y 0 implica modelo legacy sin estructura.
  const showDeptSelect = departments.length > 1;
  const isEdit = !!initial;
  const [values, setValues] = useState<TemplateFormValues>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(
      initial
        ? {
            name: initial.name,
            dayOfWeek: initial.dayOfWeek,
            startTime: fmtHHMM(initial.startTime),
            endTime: fmtHHMM(initial.endTime),
            requiredEmployees: initial.requiredEmployees,
            requiredSkillId: initial.requiredSkillId,
            departmentId: initial.departmentId ?? null,
          }
        : EMPTY,
    );
    setError(null);
  }, [open, initial]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!values.name.trim() || !values.startTime || !values.endTime) {
      setError(t('templates:dialog.errors.required'));
      return;
    }
    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
      });
    } catch (err) {
      setError((err as Error).message ?? t('templates:dialog.errors.generic'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('templates:dialog.titleEdit')
              : t('templates:dialog.titleNew')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('templates:dialog.descriptionEdit')
              : t('templates:dialog.descriptionNew')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="t-name">{t('templates:dialog.fields.name')}</Label>
            <Input
              id="t-name"
              value={values.name}
              onChange={(e) =>
                setValues((v) => ({ ...v, name: e.target.value }))
              }
              placeholder={t('templates:dialog.fields.namePlaceholder')}
              data-testid="t-name-input"
              disabled={submitting}
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="t-day">{t('templates:dialog.fields.day')}</Label>
            <select
              id="t-day"
              data-testid="t-day-select"
              value={values.dayOfWeek === null ? '' : values.dayOfWeek}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  dayOfWeek:
                    e.target.value === '' ? null : Number(e.target.value),
                }))
              }
              disabled={submitting}
              className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
            >
              <option value="">{t('templates:dialog.fields.dayAll')}</option>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <option key={i} value={i}>
                  {t(`templates:days.${i}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="t-start">
                {t('templates:dialog.fields.start')}
              </Label>
              <Input
                id="t-start"
                type="time"
                value={values.startTime}
                onChange={(e) =>
                  setValues((v) => ({ ...v, startTime: e.target.value }))
                }
                data-testid="t-start-input"
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-end">
                {t('templates:dialog.fields.end')}
              </Label>
              <Input
                id="t-end"
                type="time"
                value={values.endTime}
                onChange={(e) =>
                  setValues((v) => ({ ...v, endTime: e.target.value }))
                }
                data-testid="t-end-input"
                disabled={submitting}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="t-required">
              {t('templates:dialog.fields.requiredEmployees')}{' '}
              <span className="text-muted-foreground">
                {t('templates:dialog.fields.requiredEmployeesHint')}
              </span>
            </Label>
            <Input
              id="t-required"
              type="number"
              min={0}
              value={values.requiredEmployees ?? ''}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  requiredEmployees:
                    e.target.value === '' ? null : Number(e.target.value),
                }))
              }
              data-testid="t-required-input"
              disabled={submitting}
            />
          </div>
          {showDeptSelect && (
            <div className="space-y-1">
              <Label htmlFor="t-department">
                {t('templates:dialog.fields.department')}{' '}
                <span className="text-muted-foreground">
                  {t('templates:dialog.fields.departmentOptional')}
                </span>
              </Label>
              <select
                id="t-department"
                data-testid="t-department-select"
                value={values.departmentId ?? ''}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    departmentId:
                      e.target.value === '' ? null : e.target.value,
                  }))
                }
                disabled={submitting || departmentsQ.isLoading}
                className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
              >
                <option value="">
                  {t('templates:dialog.fields.departmentAll')}
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="t-skill">
              {t('templates:dialog.fields.skill')}{' '}
              <span className="text-muted-foreground">
                {t('templates:dialog.fields.skillOptional')}
              </span>
            </Label>
            <select
              id="t-skill"
              data-testid="t-skill-select"
              value={values.requiredSkillId ?? ''}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  requiredSkillId: e.target.value === '' ? null : e.target.value,
                }))
              }
              disabled={submitting || skills.isLoading}
              className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
            >
              <option value="">{t('templates:dialog.fields.skillNone')}</option>
              {(skills.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
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
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t('templates:dialog.actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              data-testid="t-submit"
            >
              {submitting
                ? t('templates:dialog.actions.submitting')
                : isEdit
                  ? t('templates:dialog.actions.submitEdit')
                  : t('templates:dialog.actions.submitCreate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/** Helper de mapeo: TemplateFormValues → CreateShiftTemplatePayload. */
export const toCreatePayload = (
  v: TemplateFormValues,
): CreateShiftTemplatePayload => ({
  name: v.name,
  dayOfWeek: v.dayOfWeek,
  startTime: v.startTime,
  endTime: v.endTime,
  requiredEmployees: v.requiredEmployees,
  requiredSkillId: v.requiredSkillId,
  departmentId: v.departmentId,
});

/** Helper de mapeo: TemplateFormValues → UpdateShiftTemplatePayload. */
export const toUpdatePayload = (
  v: TemplateFormValues,
): UpdateShiftTemplatePayload => ({
  name: v.name,
  dayOfWeek: v.dayOfWeek,
  startTime: v.startTime,
  endTime: v.endTime,
  requiredEmployees: v.requiredEmployees,
  requiredSkillId: v.requiredSkillId,
  departmentId: v.departmentId,
});
