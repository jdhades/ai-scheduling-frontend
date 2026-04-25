import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import { TENANT_ID } from '../config';
import type {
  Employee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from '../types/employee';

const KEYS = {
  list: () => ['employees', TENANT_ID] as const,
  byId: (id: string) => ['employees', TENANT_ID, id] as const,
};

export function useEmployeesQuery() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: async () => {
      const { data } = await api.get<Employee[]>('/employees');
      // Normalizamos `skills` a [] para que consumidores legacy (ScheduleGrid →
      // EmployeeRow) puedan llamar `.includes()` sin defensa adicional.
      return data.map((e) => ({ ...e, skills: e.skills ?? [] }));
    },
  });
}

export function useEmployeeQuery(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.byId(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<Employee>(`/employees/${id}`);
      return data;
    },
  });
}

export function useCreateEmployeeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateEmployeePayload) => {
      const { data } = await api.post<{ employeeId: string }>(
        '/employees',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list() });
    },
  });
}

export function useUpdateEmployeeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: UpdateEmployeePayload;
    }) => {
      await api.patch(`/employees/${id}`, patch);
      return { id };
    },
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: KEYS.list() });
      qc.invalidateQueries({ queryKey: KEYS.byId(id) });
    },
  });
}

export function useDeleteEmployeeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/employees/${id}`);
      return { id };
    },
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: KEYS.list() });
      qc.removeQueries({ queryKey: KEYS.byId(id) });
    },
  });
}
