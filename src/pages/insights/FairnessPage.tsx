import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useFairnessHistoryQuery } from '../../api/fairness-history.api';
import { useEmployeesQuery } from '../../api/employees.api';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DataTable } from '../../components/ui/data-table';

const upcomingMondayISO = (): string => {
  const d = new Date();
  const dow = d.getUTCDay();
  const daysUntilMonday = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  return d.toISOString().slice(0, 10);
};

interface FairnessRow {
  employeeId: string;
  hoursWorked: number;
  undesirableCount: number;
  nightShiftCount: number;
  weekendCount: number;
  voluntaryExtraShifts: number;
}

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

  const empById = useMemo(
    () => new Map((employees.data ?? []).map((e) => [e.id, e.name] as const)),
    [employees.data],
  );
  const rows = (fairness.data ?? []) as FairnessRow[];

  const columns = useMemo<ColumnDef<FairnessRow>[]>(
    () => [
      {
        id: 'employee',
        header: 'Empleado',
        accessorFn: (r) => empById.get(r.employeeId) ?? r.employeeId.slice(0, 8) + '…',
        enableGlobalFilter: true,
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'hoursWorked',
        header: 'Horas',
        cell: ({ row }) => (
          <span className="block text-right">{row.original.hoursWorked}</span>
        ),
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      },
      {
        accessorKey: 'undesirableCount',
        header: 'Undesirable',
        cell: ({ row }) => (
          <span className="block text-right">{row.original.undesirableCount}</span>
        ),
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      },
      {
        accessorKey: 'nightShiftCount',
        header: 'Nocturnos',
        cell: ({ row }) => (
          <span className="block text-right">{row.original.nightShiftCount}</span>
        ),
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      },
      {
        accessorKey: 'weekendCount',
        header: 'Weekend',
        cell: ({ row }) => (
          <span className="block text-right">{row.original.weekendCount}</span>
        ),
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      },
      {
        accessorKey: 'voluntaryExtraShifts',
        header: 'Voluntary extra',
        cell: ({ row }) => (
          <span className="block text-right">{row.original.voluntaryExtraShifts}</span>
        ),
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      },
    ],
    [empById],
  );

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

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.employeeId}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder="Buscar empleado…"
        isLoading={fairness.isLoading}
        errorMessage={fairness.isError ? 'Error cargando fairness.' : undefined}
        emptyMessage="No hay datos para esa semana."
      />
    </div>
  );
};
