import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useFairnessHistoryQuery } from '../../api/fairness-history.api';
import { useEmployeesQuery } from '../../api/employees.api';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

const upcomingMondayISO = (): string => {
  const d = new Date();
  const dow = d.getUTCDay();
  const daysUntilMonday = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  return d.toISOString().slice(0, 10);
};

/**
 * FairnessPage — vista por semana de los contadores acumulados.
 *
 * El score (0–1000) se calcula post-hoc en el backend con la fórmula
 * undesirable*2 + night*1.5 + weekend*1.2 - voluntary*0.5. Acá solo
 * mostramos los contadores crudos; la weighted score es un cálculo
 * aparte que podemos sumar más adelante.
 */
export const FairnessPage = () => {
  const [weekStart, setWeekStart] = useState<string>(upcomingMondayISO());
  const employees = useEmployeesQuery();
  const fairness = useFairnessHistoryQuery(weekStart);

  const empById = new Map(
    (employees.data ?? []).map((e) => [e.id, e.name] as const),
  );
  const rows = fairness.data ?? [];

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Fairness por empleado</h1>
          <p className="text-sm text-muted-foreground">
            Contadores acumulados para la semana seleccionada.
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-week">Semana</Label>
          <Input
            id="f-week"
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            data-testid="f-week-input"
            className="w-44"
          />
        </div>
      </header>

      {fairness.isError && (
        <div className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          Error cargando fairness.
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-surface-low">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead className="text-right">Horas</TableHead>
              <TableHead className="text-right">Undesirable</TableHead>
              <TableHead className="text-right">Nocturnos</TableHead>
              <TableHead className="text-right">Weekend</TableHead>
              <TableHead className="text-right">Voluntary extra</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fairness.isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Cargando…
                </TableCell>
              </TableRow>
            )}
            {!fairness.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay datos para esa semana.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.employeeId}>
                <TableCell className="font-medium">
                  {empById.get(r.employeeId) ?? r.employeeId.slice(0, 8) + '…'}
                </TableCell>
                <TableCell className="text-right">{r.hoursWorked}</TableCell>
                <TableCell className="text-right">{r.undesirableCount}</TableCell>
                <TableCell className="text-right">{r.nightShiftCount}</TableCell>
                <TableCell className="text-right">{r.weekendCount}</TableCell>
                <TableCell className="text-right">{r.voluntaryExtraShifts}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
