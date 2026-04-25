import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';
import type {
  AbsenceReport,
  CreateAbsenceReportPayload,
} from '../types/approvals';

const KEYS = {
  list: (filter?: { employeeId?: string; isUrgent?: boolean; from?: string }) =>
    ['absence-reports', TENANT_ID, filter ?? {}] as const,
};

export function useAbsenceReportsQuery(filter?: {
  employeeId?: string;
  isUrgent?: boolean;
  from?: string;
}) {
  return useQuery({
    queryKey: KEYS.list(filter),
    queryFn: async () => {
      const { data } = await api.get<AbsenceReport[]>('/absence-reports', {
        params: filter,
      });
      return data;
    },
  });
}

export function useCreateAbsenceReportMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAbsenceReportPayload) => {
      const { data } = await api.post<AbsenceReport>(
        '/absence-reports',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absence-reports', TENANT_ID] });
    },
  });
}
