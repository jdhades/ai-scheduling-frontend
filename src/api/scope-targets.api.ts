import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';

/**
 * scope-targets.api — listings read-only de branches y departments.
 * Phase 14.3 — usado por CompanyPolicyFormDialog para que el manager
 * pueda elegir el target del scope en un dropdown.
 */

export interface ScopeTarget {
  id: string;
  name: string;
}

export const useBranchesQuery = () =>
  useQuery({
    queryKey: ['branches', TENANT_ID],
    queryFn: async (): Promise<ScopeTarget[]> => {
      const { data } = await api.get<ScopeTarget[]>('/branches');
      return data ?? [];
    },
  });

export const useDepartmentsQuery = () =>
  useQuery({
    queryKey: ['departments', TENANT_ID],
    queryFn: async (): Promise<ScopeTarget[]> => {
      const { data } = await api.get<ScopeTarget[]>('/departments');
      return data ?? [];
    },
  });
