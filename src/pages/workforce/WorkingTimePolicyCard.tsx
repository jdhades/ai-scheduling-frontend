import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWorkingTimePolicyQuery } from '../../api/working-time-policy.api';
import type { PolicySource } from '../../types/working-time-policy';
import { Card } from '../../components/ui/Card';

interface Props {
  employeeId: string;
}

const sourceTone: Record<PolicySource, string> = {
  employee: 'text-primary',
  department: 'text-secondary',
  company: 'text-muted-foreground',
  'system-fallback': 'text-muted-foreground/60',
};

/**
 * WorkingTimePolicyCard — muestra los caps efectivos de un empleado +
 * desde qué nivel viene cada uno + los valores puros por nivel para
 * mostrar la jerarquía. Read-only; el PATCH del empleado se hace
 * desde EmployeeDetailPage cuando exista.
 */
export const WorkingTimePolicyCard = ({ employeeId }: Props) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useWorkingTimePolicyQuery(employeeId);

  if (isLoading) {
    return (
      <Card className="p-4">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
        {t('workforce:employees.workingTimePolicy.loading')}
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-4 border-error/40 bg-error/10 text-sm text-error">
        {t('workforce:employees.workingTimePolicy.loadError')}
      </Card>
    );
  }

  const sourceLabel = (s: PolicySource) =>
    t(`workforce:employees.workingTimePolicy.levels.${s}`);

  return (
    <Card className="p-4 space-y-4" data-testid="wtp-card">
      <div>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          {t('workforce:employees.workingTimePolicy.title')}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t('workforce:employees.workingTimePolicy.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-white/5 bg-surface-low/60 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {t('workforce:employees.workingTimePolicy.maxHoursPerDay')}
          </div>
          <div className="text-2xl font-bold text-foreground">
            {data.effective.maxHoursPerDay}
          </div>
          <div
            className={`text-[10px] uppercase tracking-widest ${sourceTone[data.source.maxHoursPerDay]}`}
            data-testid="src-day"
          >
            {t('workforce:employees.workingTimePolicy.source', {
              level: sourceLabel(data.source.maxHoursPerDay),
            })}
          </div>
        </div>
        <div className="rounded-md border border-white/5 bg-surface-low/60 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {t('workforce:employees.workingTimePolicy.maxHoursPerWeek')}
          </div>
          <div className="text-2xl font-bold text-foreground">
            {data.effective.maxHoursPerWeek}
          </div>
          <div
            className={`text-[10px] uppercase tracking-widest ${sourceTone[data.source.maxHoursPerWeek]}`}
            data-testid="src-week"
          >
            {t('workforce:employees.workingTimePolicy.source', {
              level: sourceLabel(data.source.maxHoursPerWeek),
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('workforce:employees.workingTimePolicy.overridesTitle')}
        </h4>
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left py-1 font-medium">
                {t('workforce:employees.workingTimePolicy.level')}
              </th>
              <th className="text-right py-1 font-medium">
                {t('workforce:employees.workingTimePolicy.perDay')}
              </th>
              <th className="text-right py-1 font-medium">
                {t('workforce:employees.workingTimePolicy.perWeek')}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-white/5">
              <td className="py-1 text-foreground">
                {t('workforce:employees.workingTimePolicy.levels.employee')}
              </td>
              <td className="text-right text-foreground">
                {data.overrides.employee.maxHoursPerDay ?? '—'}
              </td>
              <td className="text-right text-foreground">
                {data.overrides.employee.maxHoursPerWeek ?? '—'}
              </td>
            </tr>
            <tr className="border-t border-white/5">
              <td className="py-1 text-muted-foreground">
                {t('workforce:employees.workingTimePolicy.levels.department')}
              </td>
              <td className="text-right text-muted-foreground">
                {data.overrides.department?.maxHoursPerDay ?? '—'}
              </td>
              <td className="text-right text-muted-foreground">
                {data.overrides.department?.maxHoursPerWeek ?? '—'}
              </td>
            </tr>
            <tr className="border-t border-white/5">
              <td className="py-1 text-muted-foreground">
                {t('workforce:employees.workingTimePolicy.levels.company')}
              </td>
              <td className="text-right text-muted-foreground">
                {data.overrides.company.maxHoursPerDay ?? '—'}
              </td>
              <td className="text-right text-muted-foreground">
                {data.overrides.company.maxHoursPerWeek ?? '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};
