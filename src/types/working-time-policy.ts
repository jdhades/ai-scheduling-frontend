/**
 * Reflejo del JSON de `GET /employees/:id/working-time-policy`.
 *
 * - `effective`: caps resueltos por el resolver (employee → department →
 *   company → system-fallback). Es lo que el scheduler usa.
 * - `source`: de qué nivel viene cada cap.
 * - `overrides`: valores puros por nivel (employee, department, company)
 *   para mostrar la jerarquía en la UI.
 */
export type PolicySource =
  | 'employee'
  | 'department'
  | 'company'
  | 'system-fallback';

export interface WorkingTimePolicyOverrides {
  maxHoursPerDay: number | null;
  maxHoursPerWeek: number | null;
}

export interface WorkingTimePolicyView {
  employeeId: string;
  companyId: string;
  departmentId: string | null;
  effective: {
    maxHoursPerDay: number;
    maxHoursPerWeek: number;
  };
  source: {
    maxHoursPerDay: PolicySource;
    maxHoursPerWeek: PolicySource;
  };
  overrides: {
    employee: WorkingTimePolicyOverrides;
    department: WorkingTimePolicyOverrides | null;
    company: WorkingTimePolicyOverrides;
  };
}
