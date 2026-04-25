import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';
import type { WorkingTimePolicyView } from '../types/working-time-policy';

const KEYS = {
  byEmployee: (employeeId: string) =>
    ['employees', TENANT_ID, employeeId, 'working-time-policy'] as const,
};

/**
 * GET /employees/:id/working-time-policy — devuelve la política
 * resuelta + las overrides por nivel + el origen de cada cap.
 */
export function useWorkingTimePolicyQuery(employeeId: string | undefined) {
  return useQuery({
    queryKey: KEYS.byEmployee(employeeId ?? ''),
    enabled: !!employeeId,
    queryFn: async () => {
      const { data } = await api.get<WorkingTimePolicyView>(
        `/employees/${employeeId}/working-time-policy`,
      );
      return data;
    },
  });
}
