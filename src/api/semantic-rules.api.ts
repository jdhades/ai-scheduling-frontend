import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';
import type {
  SemanticRule,
  SemanticRuleListItem,
  CreateSemanticRulePayload,
  UpdateSemanticRuleMetadataPayload,
  UpdateSemanticRuleTextPayload,
  CreateSemanticRuleResult,
  RuleType,
} from '../types/semantic-rule';

const KEYS = {
  list: (ruleType?: RuleType) =>
    ['semantic-rules', TENANT_ID, ruleType ?? 'all'] as const,
  byId: (id: string) => ['semantic-rules', TENANT_ID, 'byId', id] as const,
};

export function useSemanticRulesQuery(ruleType?: RuleType) {
  return useQuery({
    queryKey: KEYS.list(ruleType),
    queryFn: async () => {
      const { data } = await api.get<SemanticRuleListItem[]>(
        '/rules/semantic',
        { params: ruleType ? { ruleType } : undefined },
      );
      return data;
    },
  });
}

export function useSemanticRuleQuery(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.byId(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<SemanticRule>(`/rules/semantic/${id}`);
      return data;
    },
  });
}

export function useCreateSemanticRuleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSemanticRulePayload) => {
      const { data } = await api.post<CreateSemanticRuleResult>(
        '/rules/semantic',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semantic-rules', TENANT_ID] });
    },
  });
}

/**
 * PATCH metadata BARATO. NO regenera embedding ni structure. Para cambiar
 * el texto usar `useUpdateSemanticRuleTextMutation`.
 */
export function useUpdateSemanticRuleMetadataMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: UpdateSemanticRuleMetadataPayload;
    }) => {
      await api.patch(`/rules/semantic/${id}`, patch);
      return { id };
    },
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ['semantic-rules', TENANT_ID] });
      qc.invalidateQueries({ queryKey: KEYS.byId(id) });
    },
  });
}

/**
 * PATCH CARO. Cambia el texto y el backend regenera embedding +
 * structure (cada uno = 1 LLM call). Devuelve flags del re-proceso.
 */
export function useUpdateSemanticRuleTextMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSemanticRuleTextPayload;
    }) => {
      const { data } = await api.patch<{
        ruleId: string;
        embeddingRegenerated: boolean;
        structureRegenerated: boolean;
      }>(`/rules/semantic/${id}/text`, payload);
      return data;
    },
    onSuccess: ({ ruleId }) => {
      qc.invalidateQueries({ queryKey: ['semantic-rules', TENANT_ID] });
      qc.invalidateQueries({ queryKey: KEYS.byId(ruleId) });
    },
  });
}

export function useDeleteSemanticRuleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/rules/semantic/${id}`);
      return { id };
    },
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ['semantic-rules', TENANT_ID] });
      qc.removeQueries({ queryKey: KEYS.byId(id) });
    },
  });
}
