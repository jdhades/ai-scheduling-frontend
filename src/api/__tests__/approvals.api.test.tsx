import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import {
  useIncidentsQuery,
  useCreateIncidentMutation,
  useRejectIncidentMutation,
  useResolveIncidentMutation,
} from '../incidents.api';
import {
  useShiftSwapRequestsQuery,
  useCreateShiftSwapRequestMutation,
  useApproveShiftSwapRequestMutation,
  useRejectShiftSwapRequestMutation,
} from '../shift-swap-requests.api';
import {
  useAbsenceReportsQuery,
  useCreateAbsenceReportMutation,
} from '../absence-reports.api';
import {
  useDayOffRequestsQuery,
  useCreateDayOffRequestMutation,
  useApproveDayOffRequestMutation,
  useRejectDayOffRequestMutation,
} from '../day-off-requests.api';
import { renderHookWithQueryClient } from '../../test/renderWithProviders';
import { server } from '../../test/msw/server';
import { API_URL } from '../../config';

describe('approvals.api', () => {
  // ─── Incidents ────────────────────────────────────────────────────────────
  describe('Incidents', () => {
    it('GET /incidents', async () => {
      server.use(
        http.get(`${API_URL}/incidents`, () => HttpResponse.json([])),
      );
      const { wrapper } = renderHookWithQueryClient();
      const { result } = renderHook(() => useIncidentsQuery(), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('POST /incidents', async () => {
      let body: unknown;
      server.use(
        http.post(`${API_URL}/incidents`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ success: true }, { status: 201 });
        }),
      );
      const { wrapper } = renderHookWithQueryClient();
      const { result } = renderHook(() => useCreateIncidentMutation(), {
        wrapper,
      });
      result.current.mutate({ employeeId: 'e1', message: 'x' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(body).toEqual({ employeeId: 'e1', message: 'x' });
    });

    it('POST /incidents/:id/reject con reason', async () => {
      let body: unknown;
      server.use(
        http.post(`${API_URL}/incidents/i1/reject`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.text('', { status: 204 });
        }),
      );
      const { wrapper } = renderHookWithQueryClient();
      const { result } = renderHook(() => useRejectIncidentMutation(), {
        wrapper,
      });
      result.current.mutate({ id: 'i1', reason: 'no aplica' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(body).toEqual({ reason: 'no aplica' });
    });

    it('POST /incidents/:id/resolve con details', async () => {
      let body: unknown;
      server.use(
        http.post(`${API_URL}/incidents/i1/resolve`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.text('', { status: 204 });
        }),
      );
      const { wrapper } = renderHookWithQueryClient();
      const { result } = renderHook(() => useResolveIncidentMutation(), {
        wrapper,
      });
      result.current.mutate({ id: 'i1', details: 'cubierto' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(body).toEqual({ details: 'cubierto' });
    });
  });

  // ─── Shift Swap Requests ──────────────────────────────────────────────────
  describe('Shift Swap Requests', () => {
    it('GET con filtros', async () => {
      let url = '';
      server.use(
        http.get(`${API_URL}/shift-swap-requests`, ({ request }) => {
          url = request.url;
          return HttpResponse.json([]);
        }),
      );
      const { wrapper } = renderHookWithQueryClient();
      renderHook(() => useShiftSwapRequestsQuery({ status: 'pending' }), {
        wrapper,
      });
      await waitFor(() => expect(url).toContain('status=pending'));
    });

    it('POST + approve + reject', async () => {
      const calls: string[] = [];
      server.use(
        http.post(`${API_URL}/shift-swap-requests`, () => {
          calls.push('POST');
          return HttpResponse.json({ id: 'new' }, { status: 201 });
        }),
        http.post(`${API_URL}/shift-swap-requests/s1/approve`, () => {
          calls.push('approve');
          return HttpResponse.text('', { status: 204 });
        }),
        http.post(`${API_URL}/shift-swap-requests/s1/reject`, () => {
          calls.push('reject');
          return HttpResponse.text('', { status: 204 });
        }),
      );
      const { wrapper } = renderHookWithQueryClient();

      const create = renderHook(() => useCreateShiftSwapRequestMutation(), {
        wrapper,
      });
      create.result.current.mutate({ requesterId: 'a', targetId: 'b' });
      await waitFor(() => expect(create.result.current.isSuccess).toBe(true));

      const approve = renderHook(() => useApproveShiftSwapRequestMutation(), {
        wrapper,
      });
      approve.result.current.mutate('s1');
      await waitFor(() => expect(approve.result.current.isSuccess).toBe(true));

      const reject = renderHook(() => useRejectShiftSwapRequestMutation(), {
        wrapper,
      });
      reject.result.current.mutate('s1');
      await waitFor(() => expect(reject.result.current.isSuccess).toBe(true));

      expect(calls).toEqual(['POST', 'approve', 'reject']);
    });
  });

  // ─── Absence Reports ──────────────────────────────────────────────────────
  describe('Absence Reports', () => {
    it('GET + POST con isUrgent', async () => {
      let body: unknown;
      server.use(
        http.get(`${API_URL}/absence-reports`, () => HttpResponse.json([])),
        http.post(`${API_URL}/absence-reports`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ id: 'ar1' }, { status: 201 });
        }),
      );
      const { wrapper } = renderHookWithQueryClient();
      const list = renderHook(() => useAbsenceReportsQuery(), { wrapper });
      await waitFor(() => expect(list.result.current.isSuccess).toBe(true));

      const create = renderHook(() => useCreateAbsenceReportMutation(), {
        wrapper,
      });
      create.result.current.mutate({
        employeeId: 'e1',
        reason: 'enfermo',
        isUrgent: true,
      });
      await waitFor(() => expect(create.result.current.isSuccess).toBe(true));
      expect(body).toEqual({
        employeeId: 'e1',
        reason: 'enfermo',
        isUrgent: true,
      });
    });
  });

  // ─── Day Off Requests ─────────────────────────────────────────────────────
  describe('Day Off Requests', () => {
    it('POST + approve + reject', async () => {
      const calls: string[] = [];
      server.use(
        http.post(`${API_URL}/day-off-requests`, () => {
          calls.push('POST');
          return HttpResponse.json({ id: 'do1' }, { status: 201 });
        }),
        http.post(`${API_URL}/day-off-requests/do1/approve`, () => {
          calls.push('approve');
          return HttpResponse.text('', { status: 204 });
        }),
        http.post(`${API_URL}/day-off-requests/do1/reject`, () => {
          calls.push('reject');
          return HttpResponse.text('', { status: 204 });
        }),
      );
      const { wrapper } = renderHookWithQueryClient();

      const create = renderHook(() => useCreateDayOffRequestMutation(), {
        wrapper,
      });
      create.result.current.mutate({
        employeeId: 'e1',
        date: '2026-04-25',
        reason: 'tramite',
      });
      await waitFor(() => expect(create.result.current.isSuccess).toBe(true));

      const approve = renderHook(() => useApproveDayOffRequestMutation(), {
        wrapper,
      });
      approve.result.current.mutate('do1');
      await waitFor(() => expect(approve.result.current.isSuccess).toBe(true));

      const reject = renderHook(() => useRejectDayOffRequestMutation(), {
        wrapper,
      });
      reject.result.current.mutate('do1');
      await waitFor(() => expect(reject.result.current.isSuccess).toBe(true));

      expect(calls).toEqual(['POST', 'approve', 'reject']);
    });

    it('GET con filtros (status + rango fechas)', async () => {
      let url = '';
      server.use(
        http.get(`${API_URL}/day-off-requests`, ({ request }) => {
          url = request.url;
          return HttpResponse.json([]);
        }),
      );
      const { wrapper } = renderHookWithQueryClient();
      renderHook(
        () =>
          useDayOffRequestsQuery({
            status: 'pending',
            from: '2026-04-01',
            to: '2026-04-30',
          }),
        { wrapper },
      );
      await waitFor(() => expect(url).toContain('status=pending'));
      expect(url).toContain('from=2026-04-01');
      expect(url).toContain('to=2026-04-30');
    });
  });
});
