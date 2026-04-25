import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { FairnessPage } from '../FairnessPage';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/msw/server';
import { API_URL } from '../../../config';

describe('FairnessPage', () => {
  it('lista contadores con nombres resueltos desde /employees', async () => {
    server.use(
      http.get(`${API_URL}/employees`, () =>
        HttpResponse.json([{ id: 'e1', name: 'Ana', role: 'employee' }]),
      ),
      http.get(`${API_URL}/fairness-history`, () =>
        HttpResponse.json([
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
        ]),
      ),
    );

    renderWithProviders(<FairnessPage />);

    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument());
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // nightShift
  });

  it('muestra estado vacío cuando no hay datos para esa semana', async () => {
    server.use(
      http.get(`${API_URL}/employees`, () => HttpResponse.json([])),
      http.get(`${API_URL}/fairness-history`, () => HttpResponse.json([])),
    );
    renderWithProviders(<FairnessPage />);
    await waitFor(() =>
      expect(
        screen.getByText('No hay datos para esa semana.'),
      ).toBeInTheDocument(),
    );
  });
});
