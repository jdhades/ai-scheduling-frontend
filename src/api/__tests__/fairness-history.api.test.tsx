import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import {
  useFairnessHistoryQuery,
  useEmployeeFairnessHistoryQuery,
} from '../fairness-history.api';
import { renderHookWithQueryClient } from '../../test/renderWithProviders';
import { server } from '../../test/msw/server';
import { API_URL } from '../../config';

describe('fairness-history.api', () => {
  it('GET /fairness-history?weekStart= devuelve la lista', async () => {
    let url = '';
    server.use(
      http.get(`${API_URL}/fairness-history`, ({ request }) => {
        url = request.url;
        return HttpResponse.json([
          {
            employeeId: 'e1',
            companyId: 'c',
            weekStart: '2026-04-20',
            hoursWorked: 40,
            undesirableCount: 1,
            nightShiftCount: 2,
            weekendCount: 0,
            voluntaryExtraShifts: 0,
          },
        ]);
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(
      () => useFairnessHistoryQuery('2026-04-20'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(url).toContain('weekStart=2026-04-20');
    expect(result.current.data?.[0].hoursWorked).toBe(40);
  });

  it('no fetch cuando weekStart undefined', async () => {
    let called = false;
    server.use(
      http.get(`${API_URL}/fairness-history`, () => {
        called = true;
        return HttpResponse.json([]);
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useFairnessHistoryQuery(undefined), {
      wrapper,
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(called).toBe(false);
  });

  it('GET /fairness-history/:employeeId?weekStart=', async () => {
    server.use(
      http.get(`${API_URL}/fairness-history/e1`, () =>
        HttpResponse.json({
          employeeId: 'e1',
          companyId: 'c',
          weekStart: '2026-04-20',
          hoursWorked: 30,
          undesirableCount: 0,
          nightShiftCount: 0,
          weekendCount: 1,
          voluntaryExtraShifts: 0,
        }),
      ),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(
      () => useEmployeeFairnessHistoryQuery('e1', '2026-04-20'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.weekStart).toBe('2026-04-20');
  });
});
