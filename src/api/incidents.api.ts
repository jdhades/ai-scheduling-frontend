import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';
import type {
  Incident,
  IncidentStatus,
  CreateIncidentPayload,
} from '../types/approvals';

const KEYS = {
  list: (filter?: { employeeId?: string; status?: IncidentStatus }) =>
    ['incidents', TENANT_ID, filter ?? {}] as const,
  byId: (id: string) => ['incidents', TENANT_ID, id] as const,
};

export function useIncidentsQuery(filter?: {
  employeeId?: string;
  status?: IncidentStatus;
}) {
  return useQuery({
    queryKey: KEYS.list(filter),
    queryFn: async () => {
      const { data } = await api.get<Incident[]>('/incidents', {
        params: filter,
      });
      return data;
    },
  });
}

export function useIncidentQuery(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.byId(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<Incident>(`/incidents/${id}`);
      return data;
    },
  });
}

export function useCreateIncidentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateIncidentPayload) => {
      const { data } = await api.post<{ success: boolean }>(
        '/incidents',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents', TENANT_ID] });
    },
  });
}

export function useRejectIncidentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.post(`/incidents/${id}/reject`, { reason });
      return { id };
    },
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ['incidents', TENANT_ID] });
      qc.invalidateQueries({ queryKey: KEYS.byId(id) });
    },
  });
}

export function useResolveIncidentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, details }: { id: string; details: string }) => {
      await api.post(`/incidents/${id}/resolve`, { details });
      return { id };
    },
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ['incidents', TENANT_ID] });
      qc.invalidateQueries({ queryKey: KEYS.byId(id) });
    },
  });
}
