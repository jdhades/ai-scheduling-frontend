/**
 * FairnessHistory — contadores acumulados por empleado para una semana.
 * Reflejo del JSON de `GET /fairness-history`.
 */
export interface FairnessHistoryRow {
  employeeId: string;
  companyId: string;
  weekStart: string; // YYYY-MM-DD
  hoursWorked: number;
  undesirableCount: number;
  nightShiftCount: number;
  weekendCount: number;
  voluntaryExtraShifts: number;
}
