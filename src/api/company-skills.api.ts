import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';
import type {
  CompanySkill,
  CreateCompanySkillPayload,
} from '../types/company-skill';

const KEYS = {
  list: () => ['company-skills', TENANT_ID] as const,
  byId: (id: string) => ['company-skills', TENANT_ID, id] as const,
};

export function useCompanySkillsQuery() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: async () => {
      const { data } = await api.get<CompanySkill[]>('/company-skills');
      return data;
    },
  });
}

export function useCompanySkillQuery(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.byId(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<CompanySkill>(`/company-skills/${id}`);
      return data;
    },
  });
}

export function useCreateCompanySkillMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCompanySkillPayload) => {
      const { data } = await api.post<CompanySkill>(
        '/company-skills',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list() });
    },
  });
}

export function useDeleteCompanySkillMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/company-skills/${id}`);
      return { id };
    },
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: KEYS.list() });
      qc.removeQueries({ queryKey: KEYS.byId(id) });
    },
  });
}
