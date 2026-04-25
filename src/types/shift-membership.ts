/**
 * ShiftMembership — vínculo estable empleado ↔ shift_template con effective
 * dates. Reflejo del JSON de `GET /shift-memberships`.
 */
export interface ShiftMembership {
  id: string;
  companyId: string;
  employeeId: string;
  templateId: string;
  /** YYYY-MM-DD */
  effectiveFrom: string;
  /** YYYY-MM-DD o null = abierto */
  effectiveUntil: string | null;
  createdAt: string;
}

export interface CreateShiftMembershipPayload {
  employeeId: string;
  templateId: string;
  effectiveFrom: string;
  effectiveUntil?: string | null;
}

export interface ShiftMembershipFilter {
  employeeId?: string;
  templateId?: string;
  /** YYYY-MM-DD — devuelve memberships activas en esa fecha. */
  date?: string;
}
