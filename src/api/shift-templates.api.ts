import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';

/**
 * ShiftTemplate — definición recurrente de un turno (post-Phase 13).
 * `requiredEmployees = null` ⇒ slot ELASTIC.
 */
export interface ShiftTemplate {
  id: string;
  name: string;
  /** 0=Dom … 6=Sáb · null = todos los días */
  dayOfWeek: number | null;
  /** "HH:MM" o "HH:MM:SS" según endpoint */
  startTime: string;
  endTime: string;
  requiredSkillId: string | null;
  demandScore: number;
  undesirableWeight: number;
  isActive: boolean;
  requiredEmployees: number | null;
  /** Phase 14 — id del departamento al que pertenece. Null para tenants legacy. */
  departmentId?: string | null;
}

export interface CreateShiftTemplatePayload {
  name: string;
  dayOfWeek?: number | null;
  startTime: string;
  endTime: string;
  requiredSkillId?: string | null;
  demandScore?: number;
  undesirableWeight?: number;
  requiredEmployees?: number | null;
}

export interface UpdateShiftTemplatePayload {
  name?: string;
  dayOfWeek?: number | null;
  startTime?: string;
  endTime?: string;
  requiredSkillId?: string | null;
  demandScore?: number;
  undesirableWeight?: number;
  isActive?: boolean;
  requiredEmployees?: number | null;
}

const KEYS = {
  list: () => ['shift-templates', TENANT_ID] as const,
  byId: (id: string) => ['shift-templates', TENANT_ID, id] as const,
};

export function useShiftTemplatesQuery() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: async () => {
      const { data } = await api.get<ShiftTemplate[]>('/shift-templates');
      return data;
    },
  });
}

export function useShiftTemplateQuery(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.byId(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ShiftTemplate>(`/shift-templates/${id}`);
      return data;
    },
  });
}

export function useCreateTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateShiftTemplatePayload) => {
      const { data } = await api.post<ShiftTemplate>(
        '/shift-templates',
        payload,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list() }),
  });
}

export function useUpdateTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: UpdateShiftTemplatePayload;
    }) => {
      await api.patch(`/shift-templates/${id}`, patch);
      return { id };
    },
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: KEYS.list() });
      qc.invalidateQueries({ queryKey: KEYS.byId(id) });
    },
  });
}

export function useDeleteTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/shift-templates/${id}`);
      return { id };
    },
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: KEYS.list() });
      qc.removeQueries({ queryKey: KEYS.byId(id) });
    },
  });
}
