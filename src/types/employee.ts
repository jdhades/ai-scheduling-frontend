/**
 * Employee — shape compartido entre la UI y la API.
 *
 * Refleja el JSON que devuelve el orchestrator (`GET /employees`,
 * `GET /employees/:id`). Los campos opcionales pueden venir `null` o
 * faltar según el endpoint.
 */
export interface Employee {
  id: string;
  companyId?: string;
  name: string;
  role: string;
  /** Algunos endpoints exponen `phone`, otros `phone_number`. */
  phone?: string;
  experienceMonths?: number;
  locale?: string;
  departmentId?: string | null;
  /** Skills cargadas via join (puede no venir en list endpoints). */
  skills?: string[];
  isActive?: boolean;
}

/** Body de POST /employees. */
export interface CreateEmployeePayload {
  /** El backend espera un id externo (ej. legajo). */
  employeeId: string;
  phone: string;
  experienceMonths: number;
}

/** Body de PATCH /employees/:id (todos opcionales — partial update). */
export interface UpdateEmployeePayload {
  name?: string;
  role?: string;
  phoneNumber?: string;
  experienceMonths?: number;
  departmentId?: string | null;
  locale?: string;
  contractType?: string | null;
  maxHoursPerDay?: number | null;
  maxHoursPerWeek?: number | null;
  isActive?: boolean;
}
