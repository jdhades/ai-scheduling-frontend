import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';
import type {
  CompanyPolicy,
  CreateCompanyPolicyPayload,
  CreateCompanyPolicyResult,
  UpdateCompanyPolicyPayload,
} from '../types/company-policy';

const KEYS = {
  list: () => ['company-policies', TENANT_ID] as const,
  byId: (id: string) => ['company-policies', TENANT_ID, id] as const,
};

export function useCompanyPoliciesQuery() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: async () => {
      const { data } = await api.get<CompanyPolicy[]>('/company-policies');
      return data;
    },
  });
}

export function useCompanyPolicyQuery(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.byId(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<CompanyPolicy>(`/company-policies/${id}`);
      return data;
    },
  });
}

export function useCreateCompanyPolicyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCompanyPolicyPayload) => {
      const { data } = await api.post<CreateCompanyPolicyResult>(
        '/company-policies',
        payload,
      );
      return data;
    },
    onSuccess: (result) => {
      // Solo invalidamos cuando se persistió — needs_clarification
      // no toca la lista.
      if (result.status === 'created') {
        qc.invalidateQueries({ queryKey: KEYS.list() });
      }
    },
  });
}

export function useUpdateCompanyPolicyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: UpdateCompanyPolicyPayload;
    }) => {
      const { data } = await api.patch<CompanyPolicy>(
        `/company-policies/${id}`,
        patch,
      );
      return data;
    },
    onSuccess: (policy) => {
      qc.invalidateQueries({ queryKey: KEYS.list() });
      qc.invalidateQueries({ queryKey: KEYS.byId(policy.id) });
    },
  });
}

export function useDeleteCompanyPolicyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/company-policies/${id}`);
      return { id };
    },
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: KEYS.list() });
      qc.removeQueries({ queryKey: KEYS.byId(id) });
    },
  });
}
