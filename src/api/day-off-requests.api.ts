import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';
import type {
  DayOffRequest,
  DayOffRequestStatus,
  CreateDayOffRequestPayload,
} from '../types/approvals';

const KEYS = {
  list: (filter?: {
    employeeId?: string;
    status?: DayOffRequestStatus;
    from?: string;
    to?: string;
    managerEmployeeId?: string;
  }) => ['day-off-requests', TENANT_ID, filter ?? {}] as const,
};

export function useDayOffRequestsQuery(filter?: {
  employeeId?: string;
  status?: DayOffRequestStatus;
  from?: string;
  to?: string;
  /** Phase 15.2 — solo day-off requests del scope del manager. */
  managerEmployeeId?: string;
}) {
  return useQuery({
    queryKey: KEYS.list(filter),
    queryFn: async () => {
      const { data } = await api.get<DayOffRequest[]>('/day-off-requests', {
        params: filter,
      });
      return data;
    },
  });
}

export function useCreateDayOffRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDayOffRequestPayload) => {
      const { data } = await api.post<DayOffRequest>(
        '/day-off-requests',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['day-off-requests', TENANT_ID] });
    },
  });
}

export function useApproveDayOffRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/day-off-requests/${id}/approve`);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['day-off-requests', TENANT_ID] });
    },
  });
}

export function useRejectDayOffRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/day-off-requests/${id}/reject`);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['day-off-requests', TENANT_ID] });
    },
  });
}
