import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import {
  useShiftTemplatesQuery,
  useShiftTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} from '../shift-templates.api';
import { renderHookWithQueryClient } from '../../test/renderWithProviders';
import { server } from '../../test/msw/server';
import { API_URL } from '../../config';

const baseTpl = {
  id: 't1',
  name: 'Diurno',
  dayOfWeek: null,
  startTime: '08:00',
  endTime: '16:00',
  requiredSkillId: null,
  demandScore: 1,
  undesirableWeight: 0,
  isActive: true,
  requiredEmployees: 2,
};

describe('shift-templates.api', () => {
  it('GET /shift-templates', async () => {
    server.use(
      http.get(`${API_URL}/shift-templates`, () =>
        HttpResponse.json([baseTpl]),
      ),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useShiftTemplatesQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([baseTpl]);
  });

  it('GET /shift-templates/:id (gate por id undefined)', async () => {
    let called = false;
    server.use(
      http.get(`${API_URL}/shift-templates/:id`, () => {
        called = true;
        return HttpResponse.json(baseTpl);
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useShiftTemplateQuery(undefined), {
      wrapper,
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(called).toBe(false);
  });

  it('POST /shift-templates', async () => {
    let body: unknown;
    server.use(
      http.post(`${API_URL}/shift-templates`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(baseTpl, { status: 201 });
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useCreateTemplateMutation(), {
      wrapper,
    });
    result.current.mutate({
      name: 'Diurno',
      startTime: '08:00',
      endTime: '16:00',
      requiredEmployees: 2,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(body).toMatchObject({ name: 'Diurno', requiredEmployees: 2 });
  });

  it('PATCH /shift-templates/:id (partial update)', async () => {
    let patchBody: unknown;
    server.use(
      http.patch(`${API_URL}/shift-templates/u1`, async ({ request }) => {
        patchBody = await request.json();
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useUpdateTemplateMutation(), {
      wrapper,
    });
    result.current.mutate({ id: 'u1', patch: { name: 'Nuevo nombre' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patchBody).toEqual({ name: 'Nuevo nombre' });
  });

  it('DELETE /shift-templates/:id', async () => {
    let calledUrl = '';
    server.use(
      http.delete(`${API_URL}/shift-templates/d1`, ({ request }) => {
        calledUrl = request.url;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useDeleteTemplateMutation(), {
      wrapper,
    });
    result.current.mutate('d1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(calledUrl).toContain('/shift-templates/d1');
  });
});
