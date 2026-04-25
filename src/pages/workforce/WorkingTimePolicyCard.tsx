import { Loader2 } from 'lucide-react';
import { useWorkingTimePolicyQuery } from '../../api/working-time-policy.api';
import type { PolicySource } from '../../types/working-time-policy';
import { Card } from '../../components/ui/Card';

interface Props {
  employeeId: string;
}

const sourceLabel: Record<PolicySource, string> = {
  employee: 'Empleado',
  department: 'Depto',
  company: 'Empresa',
  'system-fallback': 'Sistema',
};

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
  const { data, isLoading, isError } = useWorkingTimePolicyQuery(employeeId);

  if (isLoading) {
    return (
      <Card className="p-4">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
        Cargando política de tiempo…
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-4 border-error/40 bg-error/10 text-sm text-error">
        Error cargando política de tiempo.
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4" data-testid="wtp-card">
      <div>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Política de tiempo (efectiva)
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Resuelta por jerarquía: empleado → depto → empresa → fallback.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-white/5 bg-surface-low/60 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Máx h / día
          </div>
          <div className="text-2xl font-bold text-foreground">
            {data.effective.maxHoursPerDay}
          </div>
          <div
            className={`text-[10px] uppercase tracking-widest ${sourceTone[data.source.maxHoursPerDay]}`}
            data-testid="src-day"
          >
            Origen: {sourceLabel[data.source.maxHoursPerDay]}
          </div>
        </div>
        <div className="rounded-md border border-white/5 bg-surface-low/60 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Máx h / semana
          </div>
          <div className="text-2xl font-bold text-foreground">
            {data.effective.maxHoursPerWeek}
          </div>
          <div
            className={`text-[10px] uppercase tracking-widest ${sourceTone[data.source.maxHoursPerWeek]}`}
            data-testid="src-week"
          >
            Origen: {sourceLabel[data.source.maxHoursPerWeek]}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Overrides por nivel
        </h4>
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left py-1 font-medium">Nivel</th>
              <th className="text-right py-1 font-medium">h/día</th>
              <th className="text-right py-1 font-medium">h/semana</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-white/5">
              <td className="py-1 text-foreground">Empleado</td>
              <td className="text-right text-foreground">
                {data.overrides.employee.maxHoursPerDay ?? '—'}
              </td>
              <td className="text-right text-foreground">
                {data.overrides.employee.maxHoursPerWeek ?? '—'}
              </td>
            </tr>
            <tr className="border-t border-white/5">
              <td className="py-1 text-muted-foreground">Departamento</td>
              <td className="text-right text-muted-foreground">
                {data.overrides.department?.maxHoursPerDay ?? '—'}
              </td>
              <td className="text-right text-muted-foreground">
                {data.overrides.department?.maxHoursPerWeek ?? '—'}
              </td>
            </tr>
            <tr className="border-t border-white/5">
              <td className="py-1 text-muted-foreground">Empresa</td>
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
