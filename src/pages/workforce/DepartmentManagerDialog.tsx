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
import { Label } from '../../components/ui/label';
import type { Department } from '../../api/scope-targets.api';
import type { Employee } from '../../types/employee';

export interface DepartmentDialogValues {
  managerEmployeeId: string | null;
  swapAutoApprove: boolean;
}

interface Props {
  department: Department | null;
  /** Candidatos sugeridos: employees del tenant con role='manager'. */
  managerCandidates: Employee[];
  /** Lista completa, por si el manager actual está fuera de los candidatos. */
  allEmployees: Employee[];
  onOpenChange: (open: boolean) => void;
  /**
   * Recibe el patch completo del depto. El controller decide qué cambió
   * vs. los valores actuales y persiste vía PATCH.
   */
  onSubmit: (values: DepartmentDialogValues) => Promise<void>;
  submitting?: boolean;
}

/**
 * DepartmentManagerDialog — settings del depto: manager + swap auto-approve.
 *
 * El manager dropdown lista employees con role='manager' como sugerencia
 * primaria + permite limpiar con "(sin manager)". Si el manager actual está
 * fuera de los candidatos (role distinto / soft-deleted) igual aparece
 * para no perder el reference.
 *
 * El toggle `swap_auto_approve` deja a los empleados del depto auto-aprobar
 * swap requests sin esperar al manager (status=accepted +
 * approved_by='system:auto-approve').
 */
export const DepartmentManagerDialog = ({
  department,
  managerCandidates,
  allEmployees,
  onOpenChange,
  onSubmit,
  submitting,
}: Props) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>('');
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (department) {
      setSelected(department.managerEmployeeId ?? '');
      setAutoApprove(department.swapAutoApprove);
      setError(null);
    }
  }, [department]);

  const open = department !== null;

  // El manager actual puede estar fuera de los candidatos (role distinto
  // o employee soft-deleted). Lo agregamos al final para no perderlo.
  const candidates: Employee[] = (() => {
    if (!department?.managerEmployeeId) return managerCandidates;
    const inCandidates = managerCandidates.some(
      (e) => e.id === department.managerEmployeeId,
    );
    if (inCandidates) return managerCandidates;
    const current = allEmployees.find(
      (e) => e.id === department.managerEmployeeId,
    );
    return current ? [...managerCandidates, current] : managerCandidates;
  })();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({
        managerEmployeeId: selected === '' ? null : selected,
        swapAutoApprove: autoApprove,
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
            {t('workforce:departments.dialog.title', {
              name: department?.name ?? '',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('workforce:departments.dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="dept-manager">
              {t('workforce:departments.dialog.fields.manager')}
            </Label>
            <select
              id="dept-manager"
              data-testid="dept-manager-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={submitting}
              className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
            >
              <option value="">
                {t('workforce:departments.dialog.fields.managerNone')}
              </option>
              {candidates.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                  {e.role !== 'manager' ? ` · ${e.role}` : ''}
                </option>
              ))}
            </select>
            {managerCandidates.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t('workforce:departments.dialog.fields.noManagersHint')}
              </p>
            )}
          </div>
          <div className="space-y-1 rounded-md border border-white/10 bg-surface-low/40 p-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                id="dept-auto-approve"
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                disabled={submitting}
                data-testid="dept-auto-approve-cb"
                className="mt-0.5 rounded border-white/20"
              />
              <div className="space-y-0.5">
                <span className="block text-sm font-medium text-foreground">
                  {t('workforce:departments.dialog.fields.swapAutoApprove')}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t('workforce:departments.dialog.fields.swapAutoApproveHint')}
                </span>
              </div>
            </label>
          </div>
          {error && (
            <p className="text-sm text-error" data-testid="dept-manager-error">
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
              {t('workforce:departments.dialog.actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              data-testid="dept-manager-submit"
            >
              {submitting
                ? t('workforce:departments.dialog.actions.submitting')
                : t('workforce:departments.dialog.actions.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
