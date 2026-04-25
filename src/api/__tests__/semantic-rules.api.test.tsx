import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import {
  useSemanticRulesQuery,
  useSemanticRuleQuery,
  useCreateSemanticRuleMutation,
  useUpdateSemanticRuleMetadataMutation,
  useUpdateSemanticRuleTextMutation,
  useDeleteSemanticRuleMutation,
} from '../semantic-rules.api';
import { renderHookWithQueryClient } from '../../test/renderWithProviders';
import { server } from '../../test/msw/server';
import { API_URL } from '../../config';

describe('semantic-rules.api', () => {
  it('GET /rules/semantic con filtro por ruleType', async () => {
    let calledUrl = '';
    server.use(
      http.get(`${API_URL}/rules/semantic`, ({ request }) => {
        calledUrl = request.url;
        return HttpResponse.json([]);
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    renderHook(() => useSemanticRulesQuery('restriction'), { wrapper });
    await waitFor(() => expect(calledUrl).toContain('ruleType=restriction'));
  });

  it('GET /rules/semantic/:id con gate por id', async () => {
    let called = false;
    server.use(
      http.get(`${API_URL}/rules/semantic/:id`, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useSemanticRuleQuery(undefined), {
      wrapper,
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(called).toBe(false);
  });

  it('POST /rules/semantic devuelve flags de creación', async () => {
    let body: unknown;
    server.use(
      http.post(`${API_URL}/rules/semantic`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          {
            id: 'r-new',
            embeddingGenerated: true,
            isDuplicate: false,
            structureExtracted: true,
            intent: 'block',
          },
          { status: 201 },
        );
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useCreateSemanticRuleMutation(), {
      wrapper,
    });
    result.current.mutate({
      ruleText: 'Pablo no trabaja los lunes',
      priorityLevel: 2,
      ruleType: 'restriction',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(body).toMatchObject({
      ruleText: 'Pablo no trabaja los lunes',
      priorityLevel: 2,
      ruleType: 'restriction',
    });
    expect(result.current.data?.embeddingGenerated).toBe(true);
  });

  it('PATCH metadata BARATO no toca el texto', async () => {
    let patchBody: unknown;
    server.use(
      http.patch(`${API_URL}/rules/semantic/u1`, async ({ request }) => {
        patchBody = await request.json();
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(
      () => useUpdateSemanticRuleMetadataMutation(),
      { wrapper },
    );
    result.current.mutate({
      id: 'u1',
      patch: { isActive: false, expiresAt: '2026-12-31T00:00:00Z' },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patchBody).toEqual({
      isActive: false,
      expiresAt: '2026-12-31T00:00:00Z',
    });
  });

  it('PATCH text dispara re-embed y devuelve flags', async () => {
    let patchBody: unknown;
    server.use(
      http.patch(
        `${API_URL}/rules/semantic/t1/text`,
        async ({ request }) => {
          patchBody = await request.json();
          return HttpResponse.json({
            ruleId: 't1',
            embeddingRegenerated: true,
            structureRegenerated: true,
          });
        },
      ),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useUpdateSemanticRuleTextMutation(), {
      wrapper,
    });
    result.current.mutate({
      id: 't1',
      payload: { ruleText: 'Texto nuevo' },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patchBody).toEqual({ ruleText: 'Texto nuevo' });
    expect(result.current.data?.embeddingRegenerated).toBe(true);
  });

  it('DELETE /rules/semantic/:id', async () => {
    let calledUrl = '';
    server.use(
      http.delete(`${API_URL}/rules/semantic/d1`, ({ request }) => {
        calledUrl = request.url;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useDeleteSemanticRuleMutation(), {
      wrapper,
    });
    result.current.mutate('d1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(calledUrl).toContain('/rules/semantic/d1');
  });
});
