import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import {
  useCompanySkillsQuery,
  useCreateCompanySkillMutation,
  useDeleteCompanySkillMutation,
} from '../company-skills.api';
import { renderHookWithQueryClient } from '../../test/renderWithProviders';
import { server } from '../../test/msw/server';
import { API_URL } from '../../config';

describe('company-skills.api', () => {
  it('GET /company-skills', async () => {
    const list = [
      { id: 's1', companyId: 'c', name: 'barista' },
      { id: 's2', companyId: 'c', name: 'caja' },
    ];
    server.use(
      http.get(`${API_URL}/company-skills`, () => HttpResponse.json(list)),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useCompanySkillsQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(list);
  });

  it('POST /company-skills + invalida list', async () => {
    let calls = 0;
    let body: unknown;
    server.use(
      http.get(`${API_URL}/company-skills`, () => {
        calls += 1;
        return HttpResponse.json([]);
      }),
      http.post(`${API_URL}/company-skills`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { id: 'new', companyId: 'c', name: 'cocinero' },
          { status: 201 },
        );
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const list = renderHook(() => useCompanySkillsQuery(), { wrapper });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));

    const create = renderHook(() => useCreateCompanySkillMutation(), { wrapper });
    create.result.current.mutate({ name: 'cocinero' });
    await waitFor(() => expect(create.result.current.isSuccess).toBe(true));

    expect(body).toEqual({ name: 'cocinero' });
    await waitFor(() => expect(calls).toBeGreaterThanOrEqual(2));
  });

  it('DELETE /company-skills/:id', async () => {
    let calledUrl = '';
    server.use(
      http.delete(`${API_URL}/company-skills/d1`, ({ request }) => {
        calledUrl = request.url;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useDeleteCompanySkillMutation(), {
      wrapper,
    });
    result.current.mutate('d1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(calledUrl).toContain('/company-skills/d1');
  });
});
