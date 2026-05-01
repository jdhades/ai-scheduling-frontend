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
  list: (filter?: {
    employeeId?: string;
    isUrgent?: boolean;
    from?: string;
    managerEmployeeId?: string;
  }) => ['absence-reports', TENANT_ID, filter ?? {}] as const,
};

export function useAbsenceReportsQuery(filter?: {
  employeeId?: string;
  isUrgent?: boolean;
  from?: string;
  /** Phase 15.2 — solo absences del scope del manager. */
  managerEmployeeId?: string;
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
      // Phase 17.2 — el creator borra assignments del range, así que
      // también invalidamos los listados de schedule para que se
      // refresquen los slots vacantes.
      qc.invalidateQueries({ queryKey: ['absence-reports', TENANT_ID] });
      qc.invalidateQueries({ queryKey: ['schedule', TENANT_ID] });
    },
  });
}

export function useDeleteAbsenceReportMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/absence-reports/${id}`);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absence-reports', TENANT_ID] });
    },
  });
}
