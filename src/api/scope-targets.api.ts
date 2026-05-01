import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';

/**
 * scope-targets.api — listings de branches y departments + write
 * mínimo para asignar el manager de un departamento.
 *
 * Phase 14.3 introdujo los GET para que CompanyPolicyFormDialog pueda
 * elegir el target del scope. Phase 15.1 extiende el shape de Department
 * con `managerEmployeeId` y agrega el PATCH para asignarlo desde la UI.
 */

export interface ScopeTarget {
  id: string;
  name: string;
}

/** Branches: shape mínimo (id+name) — todavía no necesita más metadata. */
export const useBranchesQuery = () =>
  useQuery({
    queryKey: ['branches', TENANT_ID],
    queryFn: async (): Promise<ScopeTarget[]> => {
      const { data } = await api.get<ScopeTarget[]>('/branches');
      return data ?? [];
    },
  });

/** Department con metadata extendida (Phase 15.1+). */
export interface Department extends ScopeTarget {
  branchId: string;
  /** Employee designado como manager del depto. null = sin asignar. */
  managerEmployeeId: string | null;
}

export const useDepartmentsQuery = () =>
  useQuery({
    queryKey: ['departments', TENANT_ID],
    queryFn: async (): Promise<Department[]> => {
      const { data } = await api.get<Department[]>('/departments');
      return data ?? [];
    },
  });

export interface UpdateDepartmentPayload {
  /** Mandar `null` para limpiar la asignación. Mandar undefined no toca. */
  managerEmployeeId?: string | null;
  name?: string;
}

export const useUpdateDepartmentMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: UpdateDepartmentPayload;
    }) => {
      const { data } = await api.patch<Department>(`/departments/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments', TENANT_ID] });
    },
  });
};
