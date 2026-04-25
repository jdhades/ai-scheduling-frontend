import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import {
  useEmployeesQuery,
  useEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from '../employees.api';
import { renderHookWithQueryClient } from '../../test/renderWithProviders';
import { server } from '../../test/msw/server';
import { API_URL, TENANT_ID } from '../../config';

describe('employees.api', () => {
  describe('useEmployeesQuery', () => {
    it('GET /employees devuelve la lista', async () => {
      const list = [
        { id: 'a', name: 'Ana', role: 'employee' },
        { id: 'b', name: 'Bruno', role: 'manager' },
      ];
      server.use(
        http.get(`${API_URL}/employees`, () => HttpResponse.json(list)),
      );
      const { wrapper } = renderHookWithQueryClient();

      const { result } = renderHook(() => useEmployeesQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      // El hook normaliza skills a [] cuando falta.
      expect(result.current.data).toEqual(list.map((e) => ({ ...e, skills: [] })));
    });

    it('manda companyId como query param vía interceptor', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_URL}/employees`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json([]);
        }),
      );
      const { wrapper } = renderHookWithQueryClient();
      const { result } = renderHook(() => useEmployeesQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain(`companyId=${TENANT_ID}`);
    });

    it('expone isError cuando el backend devuelve 500', async () => {
      server.use(
        http.get(`${API_URL}/employees`, () =>
          HttpResponse.json({ message: 'boom' }, { status: 500 }),
        ),
      );
      const { wrapper } = renderHookWithQueryClient();
      const { result } = renderHook(() => useEmployeesQuery(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useEmployeeQuery', () => {
    it('no dispara fetch cuando id es undefined', async () => {
      let called = false;
      server.use(
        http.get(`${API_URL}/employees/:id`, () => {
          called = true;
          return HttpResponse.json({});
        }),
      );
      const { wrapper } = renderHookWithQueryClient();
      const { result } = renderHook(() => useEmployeeQuery(undefined), {
        wrapper,
      });
      // Esperamos un tick — la query no debe correr.
      await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
      expect(called).toBe(false);
    });

    it('GET /employees/:id devuelve el empleado', async () => {
      const emp = { id: 'a1', name: 'Ana', role: 'employee' };
      server.use(
        http.get(`${API_URL}/employees/a1`, () => HttpResponse.json(emp)),
      );
      const { wrapper } = renderHookWithQueryClient();
      const { result } = renderHook(() => useEmployeeQuery('a1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(emp);
    });
  });

  describe('useCreateEmployeeMutation', () => {
    it('POST /employees + invalida la lista en éxito', async () => {
      let postBody: unknown;
      let listCallsAfterCreate = 0;
      // Primera llamada: list inicial. Tras crear, la invalidación dispara
      // un re-fetch que cuenta como segunda llamada.
      server.use(
        http.get(`${API_URL}/employees`, () => {
          listCallsAfterCreate += 1;
          return HttpResponse.json([]);
        }),
        http.post(`${API_URL}/employees`, async ({ request }) => {
          postBody = await request.json();
          return HttpResponse.json({ employeeId: 'new-1' }, { status: 201 });
        }),
      );

      const { wrapper, queryClient } = renderHookWithQueryClient();
      // Pre-cargamos la query para que la invalidación tenga algo que invalidar.
      const listHook = renderHook(() => useEmployeesQuery(), { wrapper });
      await waitFor(() => expect(listHook.result.current.isSuccess).toBe(true));

      const { result } = renderHook(() => useCreateEmployeeMutation(), {
        wrapper,
      });
      result.current.mutate({
        name: 'Sofía López',
        phone: '+1000',
        experienceMonths: 6,
        externalId: 'new-1',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(postBody).toEqual({
        name: 'Sofía López',
        phone: '+1000',
        experienceMonths: 6,
        externalId: 'new-1',
      });
      // Esperamos el re-fetch tras invalidate.
      await waitFor(() => expect(listCallsAfterCreate).toBeGreaterThanOrEqual(2));
      expect(queryClient).toBeDefined();
    });
  });

  describe('useUpdateEmployeeMutation', () => {
    it('PATCH /employees/:id con body parcial', async () => {
      let patchBody: unknown;
      server.use(
        http.patch(`${API_URL}/employees/u1`, async ({ request }) => {
          patchBody = await request.json();
          return HttpResponse.text('', { status: 204 });
        }),
      );
      const { wrapper } = renderHookWithQueryClient();
      const { result } = renderHook(() => useUpdateEmployeeMutation(), {
        wrapper,
      });
      result.current.mutate({ id: 'u1', patch: { name: 'Nuevo Nombre' } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(patchBody).toEqual({ name: 'Nuevo Nombre' });
    });
  });

  describe('useDeleteEmployeeMutation', () => {
    it('DELETE /employees/:id', async () => {
      let calledUrl = '';
      server.use(
        http.delete(`${API_URL}/employees/d1`, ({ request }) => {
          calledUrl = request.url;
          return HttpResponse.text('', { status: 204 });
        }),
      );
      const { wrapper } = renderHookWithQueryClient();
      const { result } = renderHook(() => useDeleteEmployeeMutation(), {
        wrapper,
      });
      result.current.mutate('d1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(calledUrl).toContain('/employees/d1');
    });
  });
});
