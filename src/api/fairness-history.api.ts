import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';
import type { FairnessHistoryRow } from '../types/fairness';

const KEYS = {
  byWeek: (weekStart: string) =>
    ['fairness-history', TENANT_ID, weekStart] as const,
  byEmployee: (employeeId: string, weekStart: string) =>
    ['fairness-history', TENANT_ID, weekStart, employeeId] as const,
};

/**
 * GET /fairness-history?weekStart=YYYY-MM-DD — todos los empleados.
 * Read-only; el backend escribe estas filas automáticamente al generar
 * el horario.
 */
export function useFairnessHistoryQuery(weekStart: string | undefined) {
  return useQuery({
    queryKey: KEYS.byWeek(weekStart ?? ''),
    enabled: !!weekStart,
    queryFn: async () => {
      const { data } = await api.get<FairnessHistoryRow[]>('/fairness-history', {
        params: { weekStart },
      });
      return data;
    },
  });
}

/**
 * GET /fairness-history/:employeeId?weekStart=YYYY-MM-DD — un empleado.
 */
export function useEmployeeFairnessHistoryQuery(
  employeeId: string | undefined,
  weekStart: string | undefined,
) {
  return useQuery({
    queryKey: KEYS.byEmployee(employeeId ?? '', weekStart ?? ''),
    enabled: !!employeeId && !!weekStart,
    queryFn: async () => {
      const { data } = await api.get<FairnessHistoryRow>(
        `/fairness-history/${employeeId}`,
        { params: { weekStart } },
      );
      return data;
    },
  });
}
