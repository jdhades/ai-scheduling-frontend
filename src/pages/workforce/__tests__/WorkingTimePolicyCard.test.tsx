import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { WorkingTimePolicyCard } from '../WorkingTimePolicyCard';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/msw/server';
import { API_URL } from '../../../config';

describe('WorkingTimePolicyCard', () => {
  it('muestra effective + source + overrides cuando todos los niveles aportan', async () => {
    server.use(
      http.get(`${API_URL}/employees/e1/working-time-policy`, () =>
        HttpResponse.json({
          employeeId: 'e1',
          companyId: 'c',
          departmentId: 'd1',
          effective: { maxHoursPerDay: 9, maxHoursPerWeek: 45 },
          source: {
            maxHoursPerDay: 'employee',
            maxHoursPerWeek: 'department',
          },
          overrides: {
            employee: { maxHoursPerDay: 9, maxHoursPerWeek: null },
            department: { maxHoursPerDay: null, maxHoursPerWeek: 45 },
            company: { maxHoursPerDay: null, maxHoursPerWeek: 50 },
          },
        }),
      ),
    );

    renderWithProviders(<WorkingTimePolicyCard employeeId="e1" />);

    await waitFor(() =>
      expect(screen.getByTestId('wtp-card')).toBeInTheDocument(),
    );
    // El "9" aparece dos veces (effective day + override empleado).
    expect(screen.getAllByText('9').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('45').length).toBeGreaterThanOrEqual(1);
    // Source labels.
    expect(screen.getByTestId('src-day')).toHaveTextContent('Empleado');
    expect(screen.getByTestId('src-week')).toHaveTextContent('Depto');
    // Override de company-level (50, no efectivo) presente solo en la tabla.
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renderiza fallback de sistema cuando ningún nivel define el cap', async () => {
    server.use(
      http.get(`${API_URL}/employees/e2/working-time-policy`, () =>
        HttpResponse.json({
          employeeId: 'e2',
          companyId: 'c',
          departmentId: null,
          effective: { maxHoursPerDay: 8, maxHoursPerWeek: 40 },
          source: {
            maxHoursPerDay: 'system-fallback',
            maxHoursPerWeek: 'system-fallback',
          },
          overrides: {
            employee: { maxHoursPerDay: null, maxHoursPerWeek: null },
            department: null,
            company: { maxHoursPerDay: null, maxHoursPerWeek: null },
          },
        }),
      ),
    );

    renderWithProviders(<WorkingTimePolicyCard employeeId="e2" />);

    await waitFor(() =>
      expect(screen.getByTestId('src-day')).toHaveTextContent('Sistema'),
    );
    expect(screen.getByTestId('src-week')).toHaveTextContent('Sistema');
  });

  it('muestra error si la API falla', async () => {
    server.use(
      http.get(`${API_URL}/employees/e3/working-time-policy`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );

    renderWithProviders(<WorkingTimePolicyCard employeeId="e3" />);

    await waitFor(() =>
      expect(
        screen.getByText('Error cargando política de tiempo.'),
      ).toBeInTheDocument(),
    );
  });
});
