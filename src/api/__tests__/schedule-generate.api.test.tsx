import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useGenerateHybridForWeekMutation } from '../schedule.api';
import { renderHookWithQueryClient } from '../../test/renderWithProviders';
import { server } from '../../test/msw/server';
import { API_URL } from '../../config';

describe('useGenerateHybridForWeekMutation', () => {
  it('POST /schedules/generate con weekStart + strategy=hybrid + scope opcional', async () => {
    let body: any;
    server.use(
      http.post(`${API_URL}/schedules/generate`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          assignmentsCount: 30,
          unfilledShiftsCount: 1,
          llmAccepted: 30,
          algorithmCorrected: 0,
          explanation: 'Generado',
          warnings: [],
        });
      }),
    );

    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useGenerateHybridForWeekMutation(), {
      wrapper,
    });
    result.current.mutate({
      weekStart: '2026-04-27',
      maxFairnessDeviation: 1,
      departmentId: 'dept-1',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(body.weekStart).toBe('2026-04-27');
    expect(body.strategy).toBe('hybrid');
    expect(body.maxFairnessDeviation).toBe(1);
    expect(body.departmentId).toBe('dept-1');
    expect(result.current.data?.weekStart).toBe('2026-04-27');
    expect(result.current.data?.result.assignmentsCount).toBe(30);
  });

  it('expone error cuando el backend devuelve 500', async () => {
    server.use(
      http.post(`${API_URL}/schedules/generate`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useGenerateHybridForWeekMutation(), {
      wrapper,
    });
    result.current.mutate({ weekStart: '2026-04-27' });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
