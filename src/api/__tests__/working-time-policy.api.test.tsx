import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useWorkingTimePolicyQuery } from '../working-time-policy.api';
import { renderHookWithQueryClient } from '../../test/renderWithProviders';
import { server } from '../../test/msw/server';
import { API_URL } from '../../config';

describe('working-time-policy.api', () => {
  it('GET /employees/:id/working-time-policy', async () => {
    const view = {
      employeeId: 'e1',
      companyId: 'c',
      departmentId: 'd1',
      effective: { maxHoursPerDay: 8, maxHoursPerWeek: 40 },
      source: { maxHoursPerDay: 'employee', maxHoursPerWeek: 'department' },
      overrides: {
        employee: { maxHoursPerDay: 8, maxHoursPerWeek: null },
        department: { maxHoursPerDay: null, maxHoursPerWeek: 40 },
        company: { maxHoursPerDay: null, maxHoursPerWeek: 45 },
      },
    };
    server.use(
      http.get(`${API_URL}/employees/e1/working-time-policy`, () =>
        HttpResponse.json(view),
      ),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(() => useWorkingTimePolicyQuery('e1'), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(view);
  });

  it('no fetch cuando employeeId es undefined', async () => {
    let called = false;
    server.use(
      http.get(`${API_URL}/employees/:id/working-time-policy`, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    const { wrapper } = renderHookWithQueryClient();
    const { result } = renderHook(
      () => useWorkingTimePolicyQuery(undefined),
      { wrapper },
    );
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(called).toBe(false);
  });
});
