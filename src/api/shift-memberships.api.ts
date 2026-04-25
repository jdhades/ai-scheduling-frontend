import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';
import type {
  ShiftMembership,
  CreateShiftMembershipPayload,
  ShiftMembershipFilter,
} from '../types/shift-membership';

const KEYS = {
  list: (filter?: ShiftMembershipFilter) =>
    ['shift-memberships', TENANT_ID, filter ?? {}] as const,
  byId: (id: string) => ['shift-memberships', TENANT_ID, id] as const,
};

export function useShiftMembershipsQuery(filter?: ShiftMembershipFilter) {
  return useQuery({
    queryKey: KEYS.list(filter),
    queryFn: async () => {
      const { data } = await api.get<ShiftMembership[]>('/shift-memberships', {
        params: filter,
      });
      return data;
    },
  });
}

export function useShiftMembershipQuery(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.byId(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ShiftMembership>(
        `/shift-memberships/${id}`,
      );
      return data;
    },
  });
}

export function useCreateShiftMembershipMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateShiftMembershipPayload) => {
      const { data } = await api.post<ShiftMembership>(
        '/shift-memberships',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shift-memberships', TENANT_ID] });
    },
  });
}

export function useDeleteShiftMembershipMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/shift-memberships/${id}`);
      return { id };
    },
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ['shift-memberships', TENANT_ID] });
      qc.removeQueries({ queryKey: KEYS.byId(id) });
    },
  });
}
