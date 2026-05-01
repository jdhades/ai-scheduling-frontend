import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEmployeesQuery } from '../../api/employees.api';

interface Props {
  value: string | undefined;
  onChange: (managerEmployeeId: string | undefined) => void;
}

/**
 * ManagerScopeFilter — dropdown reusable para filtrar approvals
 * (incidents/swaps/absences/day-offs) al scope de un manager (su(s)
 * departamento(s) + depts sin asignar como fallback de triage).
 *
 * Smart-skip: si el tenant tiene 0 ó 1 manager el filter es redundante
 * y se oculta. La página queda sin el control.
 */
export const ManagerScopeFilter = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  const employeesQ = useEmployeesQuery();

  const managers = useMemo(
    () => (employeesQ.data ?? []).filter((e) => e.role === 'manager'),
    [employeesQ.data],
  );

  if (managers.length <= 1) return null;

  return (
    <select
      data-testid="manager-scope-filter"
      aria-label={t('common:managerFilter.label')}
      value={value ?? ''}
      onChange={(e) =>
        onChange(e.target.value === '' ? undefined : e.target.value)
      }
      className="flex h-9 rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
    >
      <option value="">{t('common:managerFilter.all')}</option>
      {managers.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
};
