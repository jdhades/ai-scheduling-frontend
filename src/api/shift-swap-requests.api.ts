import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';
import type {
  ShiftSwapRequest,
  ShiftSwapRequestStatus,
  CreateShiftSwapRequestPayload,
} from '../types/approvals';

const KEYS = {
  list: (filter?: {
    requesterId?: string;
    targetId?: string;
    status?: ShiftSwapRequestStatus;
    managerEmployeeId?: string;
  }) => ['shift-swap-requests', TENANT_ID, filter ?? {}] as const,
  byId: (id: string) => ['shift-swap-requests', TENANT_ID, id] as const,
};

export function useShiftSwapRequestsQuery(filter?: {
  requesterId?: string;
  targetId?: string;
  status?: ShiftSwapRequestStatus;
  /** Phase 15.2 — solo swap requests del scope del manager. */
  managerEmployeeId?: string;
}) {
  return useQuery({
    queryKey: KEYS.list(filter),
    queryFn: async () => {
      const { data } = await api.get<ShiftSwapRequest[]>(
        '/shift-swap-requests',
        { params: filter },
      );
      return data;
    },
  });
}

export function useCreateShiftSwapRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateShiftSwapRequestPayload) => {
      const { data } = await api.post<ShiftSwapRequest>(
        '/shift-swap-requests',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shift-swap-requests', TENANT_ID] });
    },
  });
}

export function useApproveShiftSwapRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/shift-swap-requests/${id}/approve`);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shift-swap-requests', TENANT_ID] });
    },
  });
}

export function useRejectShiftSwapRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/shift-swap-requests/${id}/reject`);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shift-swap-requests', TENANT_ID] });
    },
  });
}
