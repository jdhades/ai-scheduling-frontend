import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router-dom';
import { EmployeeDetailPage } from '../EmployeeDetailPage';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/msw/server';
import { API_URL } from '../../../config';

const renderAt = (path: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/workforce/employees/:id" element={<EmployeeDetailPage />} />
    </Routes>,
    { initialEntries: [path] },
  );

describe('EmployeeDetailPage', () => {
  it('muestra identidad del empleado + WTP card', async () => {
    server.use(
      http.get(`${API_URL}/employees/e1`, () =>
        HttpResponse.json({
          id: 'e1',
          name: 'Ana Rodríguez',
          role: 'manager',
          phone: '+5491155',
          experienceMonths: 24,
        }),
      ),
      http.get(`${API_URL}/employees/e1/working-time-policy`, () =>
        HttpResponse.json({
          employeeId: 'e1',
          companyId: 'c',
          departmentId: null,
          effective: { maxHoursPerDay: 8, maxHoursPerWeek: 40 },
          source: {
            maxHoursPerDay: 'company',
            maxHoursPerWeek: 'company',
          },
          overrides: {
            employee: { maxHoursPerDay: null, maxHoursPerWeek: null },
            department: null,
            company: { maxHoursPerDay: 8, maxHoursPerWeek: 40 },
          },
        }),
      ),
    );

    renderAt('/workforce/employees/e1');

    await waitFor(() =>
      expect(screen.getByTestId('employee-name')).toHaveTextContent(
        'Ana Rodríguez',
      ),
    );
    expect(screen.getByText('manager · +5491155')).toBeInTheDocument();
    expect(screen.getByText('24 months of experience')).toBeInTheDocument();
    // El WTP card carga después.
    await waitFor(() =>
      expect(screen.getByTestId('wtp-card')).toBeInTheDocument(),
    );
  });

  it('muestra error cuando el empleado no existe', async () => {
    server.use(
      http.get(`${API_URL}/employees/missing`, () =>
        HttpResponse.json({ message: 'not found' }, { status: 404 }),
      ),
    );

    renderAt('/workforce/employees/missing');

    await waitFor(() =>
      expect(
        screen.getByText('Employee not found or no access.'),
      ).toBeInTheDocument(),
    );
  });
});
