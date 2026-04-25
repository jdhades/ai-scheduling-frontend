import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import {
  useShiftMembershipsQuery,
  useCreateShiftMembershipMutation,
  useDeleteShiftMembershipMutation,
} from '../shift-memberships.api';
import { renderHookWithQueryClient } from '../../test/renderWithProviders';
import { server } from '../../test/msw/server';
import { API_URL } from '../../config';

describe('shift-memberships.api', () => {
  it('GET /shift-memberships sin filtro', async () => {
    const list = [
      {
        id: 'm1',
        companyId: 'c',
        employeeId: 'e1',
        templateId: 't1',
        effectiveFrom: '2026-01-01',
        effectiveUntil: null,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    server.use(
      http.get(`${API_URL}/shift-memberships`, () => HttpResponse.json(list)),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useShiftMembershipsQuery(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(list);
  });

  it('propaga filtros (employeeId, templateId, date) como query params', async () => {
    let url = '';
    server.use(
      http.get(`${API_URL}/shift-memberships`, ({ request }) => {
        url = request.url;
        return HttpResponse.json([]);
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    renderHook(
      () =>
        useShiftMembershipsQuery({
          employeeId: 'emp-1',
          templateId: 'tpl-1',
          date: '2026-04-25',
        }),
      { wrapper },
    );
    await waitFor(() => expect(url).toContain('employeeId=emp-1'));
    expect(url).toContain('templateId=tpl-1');
    expect(url).toContain('date=2026-04-25');
  });

  it('POST /shift-memberships invalida la lista', async () => {
    let listCalls = 0;
    let postBody: unknown;
    server.use(
      http.get(`${API_URL}/shift-memberships`, () => {
        listCalls += 1;
        return HttpResponse.json([]);
      }),
      http.post(`${API_URL}/shift-memberships`, async ({ request }) => {
        postBody = await request.json();
        return HttpResponse.json(
          {
            id: 'new',
            companyId: 'c',
            employeeId: 'e1',
            templateId: 't1',
            effectiveFrom: '2026-01-01',
            effectiveUntil: null,
            createdAt: '2026-01-01T00:00:00Z',
          },
          { status: 201 },
        );
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const list = renderHook(() => useShiftMembershipsQuery(), { wrapper });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));

    const create = renderHook(() => useCreateShiftMembershipMutation(), {
      wrapper,
    });
    create.result.current.mutate({
      employeeId: 'e1',
      templateId: 't1',
      effectiveFrom: '2026-01-01',
    });
    await waitFor(() => expect(create.result.current.isSuccess).toBe(true));
    expect(postBody).toEqual({
      employeeId: 'e1',
      templateId: 't1',
      effectiveFrom: '2026-01-01',
    });
    await waitFor(() => expect(listCalls).toBeGreaterThanOrEqual(2));
  });

  it('DELETE /shift-memberships/:id', async () => {
    let calledUrl = '';
    server.use(
      http.delete(`${API_URL}/shift-memberships/m9`, ({ request }) => {
        calledUrl = request.url;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useDeleteShiftMembershipMutation(), {
      wrapper,
    });
    result.current.mutate('m9');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(calledUrl).toContain('/shift-memberships/m9');
  });
});
