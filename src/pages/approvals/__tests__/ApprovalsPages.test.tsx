import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { IncidentsPage } from '../IncidentsPage';
import { SwapsPage } from '../SwapsPage';
import { AbsencesPage } from '../AbsencesPage';
import { DayOffsPage } from '../DayOffsPage';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/msw/server';
import { API_URL } from '../../../config';

describe('IncidentsPage', () => {
  it('lista + acciones reject/resolve disparan POSTs con prompt', async () => {
    const calls: string[] = [];
    server.use(
      http.get(`${API_URL}/incidents`, () =>
        HttpResponse.json([
          {
            id: 'i1',
            companyId: 'c',
            employeeId: 'emp-12345678-aa',
            type: 'MEDICAL_LEAVE',
            status: 'pending_validation',
            evidenceUrl: null,
            ocrConfidence: null,
            validated: false,
            startDate: '2026-04-20',
            endDate: '2026-04-25',
            createdAt: '2026-04-19T00:00:00Z',
            updatedAt: '2026-04-19T00:00:00Z',
          },
        ]),
      ),
      http.post(`${API_URL}/incidents/i1/reject`, () => {
        calls.push('reject');
        return HttpResponse.text('', { status: 204 });
      }),
      http.post(`${API_URL}/incidents/i1/resolve`, () => {
        calls.push('resolve');
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('motivo');

    const user = userEvent.setup();
    renderWithProviders(<IncidentsPage />);

    await waitFor(() => expect(screen.getByText('MEDICAL_LEAVE')).toBeInTheDocument());
    await user.click(screen.getByTestId('reject-i1'));
    await waitFor(() => expect(calls).toContain('reject'));
    await user.click(screen.getByTestId('resolve-i1'));
    await waitFor(() => expect(calls).toContain('resolve'));
    promptSpy.mockRestore();
  });

  it('botones deshabilitados cuando el incident está en estado terminal', async () => {
    server.use(
      http.get(`${API_URL}/incidents`, () =>
        HttpResponse.json([
          {
            id: 'i2',
            companyId: 'c',
            employeeId: 'emp-99999999',
            type: 'NO_SHOW',
            status: 'resolved',
            evidenceUrl: null,
            ocrConfidence: null,
            validated: true,
            startDate: null,
            endDate: null,
            createdAt: '2026-04-01T00:00:00Z',
            updatedAt: '2026-04-02T00:00:00Z',
          },
        ]),
      ),
    );
    renderWithProviders(<IncidentsPage />);
    await waitFor(() => expect(screen.getByText('NO_SHOW')).toBeInTheDocument());
    expect(screen.getByTestId('reject-i2')).toBeDisabled();
    expect(screen.getByTestId('resolve-i2')).toBeDisabled();
  });
});

describe('SwapsPage', () => {
  it('aprueba un swap pending', async () => {
    let approved = false;
    server.use(
      http.get(`${API_URL}/shift-swap-requests`, () =>
        HttpResponse.json([
          {
            id: 's1',
            companyId: 'c',
            requesterId: 'rrrr1234',
            targetId: 'tttt5678',
            assignmentId: null,
            status: 'pending',
            createdAt: '2026-04-19T00:00:00Z',
          },
        ]),
      ),
      http.post(`${API_URL}/shift-swap-requests/s1/approve`, () => {
        approved = true;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<SwapsPage />);
    await waitFor(() => expect(screen.getByText('pending')).toBeInTheDocument());
    await user.click(screen.getByTestId('approve-s1'));
    await waitFor(() => expect(approved).toBe(true));
  });
});

describe('AbsencesPage', () => {
  it('lista read-only con badge de urgencia', async () => {
    server.use(
      http.get(`${API_URL}/absence-reports`, () =>
        HttpResponse.json([
          {
            id: 'a1',
            companyId: 'c',
            employeeId: 'eeeeeeee-1',
            assignmentId: null,
            reason: 'Enfermo con gripe',
            isUrgent: true,
            reportedAt: '2026-04-19T08:00:00Z',
          },
        ]),
      ),
    );
    renderWithProviders(<AbsencesPage />);
    await waitFor(() =>
      expect(screen.getByText('Enfermo con gripe')).toBeInTheDocument(),
    );
    expect(screen.getByText('urgente')).toBeInTheDocument();
  });
});

describe('DayOffsPage', () => {
  it('aprueba un day-off pending', async () => {
    let approved = false;
    server.use(
      http.get(`${API_URL}/day-off-requests`, () =>
        HttpResponse.json([
          {
            id: 'd1',
            companyId: 'c',
            employeeId: 'eeee2222',
            date: '2026-04-25',
            reason: 'tramite',
            status: 'pending',
            createdAt: '2026-04-19T00:00:00Z',
          },
        ]),
      ),
      http.post(`${API_URL}/day-off-requests/d1/approve`, () => {
        approved = true;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<DayOffsPage />);
    await waitFor(() => expect(screen.getByText('tramite')).toBeInTheDocument());
    await user.click(screen.getByTestId('approve-d1'));
    await waitFor(() => expect(approved).toBe(true));
  });
});
