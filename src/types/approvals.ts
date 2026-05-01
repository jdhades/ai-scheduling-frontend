/**
 * Tipos compartidos del grupo Approvals (Incidents, Swap Requests,
 * Absence Reports, Day Off Requests).
 */

// ─── Incident ─────────────────────────────────────────────────────────────────

export type IncidentType =
  | 'MEDICAL_LEAVE'
  | 'EMERGENCY_LEAVE'
  | 'SHIFT_SWAP_REQUEST'
  | 'LATE'
  | 'NO_SHOW'
  | 'BIOMETRIC_MISS';

export type IncidentStatus =
  | 'reported'
  | 'document_received'
  | 'pending_ocr'
  | 'processing_ocr'
  | 'pending_validation'
  | 'validated'
  | 'rejected'
  | 'repair_in_progress'
  | 'replacement_pending'
  | 'replacement_assigned'
  | 'resolved';

export interface Incident {
  id: string;
  companyId: string;
  employeeId: string;
  type: IncidentType;
  status: IncidentStatus;
  evidenceUrl: string | null;
  ocrText?: string | null;
  ocrConfidence: number | null;
  validated: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentPayload {
  employeeId: string;
  message?: string;
  mediaUrl?: string;
}

// ─── ShiftSwapRequest ─────────────────────────────────────────────────────────

export type ShiftSwapRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface ShiftSwapRequest {
  id: string;
  companyId: string;
  requesterId: string;
  targetId: string;
  assignmentId: string | null;
  status: ShiftSwapRequestStatus;
  createdAt: string;
}

export interface CreateShiftSwapRequestPayload {
  requesterId: string;
  targetId: string;
  assignmentId?: string | null;
}

// ─── AbsenceReport ────────────────────────────────────────────────────────────

export interface AbsenceReport {
  id: string;
  companyId: string;
  employeeId: string;
  assignmentId: string | null;
  reason: string;
  isUrgent: boolean;
  /** Phase 17 — período de la ausencia. Single-day cuando start === end. */
  startDate: string;
  endDate: string;
  reportedAt: string;
}

export interface CreateAbsenceReportPayload {
  employeeId: string;
  assignmentId?: string | null;
  reason: string;
  isUrgent?: boolean;
  /** YYYY-MM-DD. Default backend = hoy. */
  startDate?: string;
  /** YYYY-MM-DD. Default backend = startDate. */
  endDate?: string;
}

// ─── DayOffRequest ────────────────────────────────────────────────────────────

export type DayOffRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DayOffRequest {
  id: string;
  companyId: string;
  employeeId: string;
  /** YYYY-MM-DD */
  date: string;
  reason: string;
  status: DayOffRequestStatus;
  createdAt: string;
}

export interface CreateDayOffRequestPayload {
  employeeId: string;
  date: string;
  reason: string;
}
