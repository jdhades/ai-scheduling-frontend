import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { EmployeesPage } from '../EmployeesPage';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/msw/server';
import { API_URL } from '../../../config';

describe('EmployeesPage', () => {
  it('lista empleados desde GET /employees', async () => {
    server.use(
      http.get(`${API_URL}/employees`, () =>
        HttpResponse.json([
          { id: 'e1', name: 'Ana', role: 'employee', phone: '+111' },
          { id: 'e2', name: 'Bruno', role: 'manager', phone: '+222' },
        ]),
      ),
    );

    renderWithProviders(<EmployeesPage />);

    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument());
    expect(screen.getByText('Bruno')).toBeInTheDocument();
    expect(screen.getByText('2 empleados')).toBeInTheDocument();
  });

  it('estado vacío cuando no hay empleados', async () => {
    server.use(
      http.get(`${API_URL}/employees`, () => HttpResponse.json([])),
    );

    renderWithProviders(<EmployeesPage />);

    await waitFor(() =>
      expect(screen.getByText('No hay empleados todavía.')).toBeInTheDocument(),
    );
  });

  it('crea un empleado vía dialog y refresca la lista', async () => {
    let listCalls = 0;
    let createBody: unknown;
    server.use(
      http.get(`${API_URL}/employees`, () => {
        listCalls += 1;
        // 1ra llamada: vacío. 2da (post create): 1 empleado.
        return HttpResponse.json(
          listCalls === 1 ? [] : [{ id: 'new', name: 'Recién creado', role: 'employee' }],
        );
      }),
      http.post(`${API_URL}/employees`, async ({ request }) => {
        createBody = await request.json();
        return HttpResponse.json({ employeeId: 'new' }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />);

    // Espera estado vacío inicial.
    await waitFor(() =>
      expect(screen.getByText('No hay empleados todavía.')).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId('new-employee-btn'));
    await user.type(screen.getByTestId('employee-id-input'), 'leg-1');
    await user.type(screen.getByTestId('employee-phone-input'), '+5491100');
    await user.clear(screen.getByTestId('employee-exp-input'));
    await user.type(screen.getByTestId('employee-exp-input'), '12');
    await user.click(screen.getByTestId('employee-submit'));

    await waitFor(() =>
      expect(createBody).toEqual({
        employeeId: 'leg-1',
        phone: '+5491100',
        experienceMonths: 12,
      }),
    );
    // Tras invalidar la query, la lista vuelve a fetch y muestra el nuevo.
    await waitFor(() =>
      expect(screen.getByText('Recién creado')).toBeInTheDocument(),
    );
  });

  it('elimina un empleado tras confirmar', async () => {
    let deleteCalled = false;
    server.use(
      http.get(`${API_URL}/employees`, () =>
        HttpResponse.json([{ id: 'd1', name: 'Para borrar', role: 'employee' }]),
      ),
      http.delete(`${API_URL}/employees/d1`, () => {
        deleteCalled = true;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />);

    await waitFor(() => expect(screen.getByText('Para borrar')).toBeInTheDocument());
    await user.click(screen.getByTestId('delete-d1'));

    await waitFor(() => expect(deleteCalled).toBe(true));
    confirmSpy.mockRestore();
  });

  it('no elimina si el usuario cancela el confirm', async () => {
    let deleteCalled = false;
    server.use(
      http.get(`${API_URL}/employees`, () =>
        HttpResponse.json([{ id: 'd2', name: 'No-borrar', role: 'employee' }]),
      ),
      http.delete(`${API_URL}/employees/d2`, () => {
        deleteCalled = true;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />);

    await waitFor(() => expect(screen.getByText('No-borrar')).toBeInTheDocument());
    await user.click(screen.getByTestId('delete-d2'));

    // Pequeña espera para asegurar que no hubo fetch.
    await new Promise((r) => setTimeout(r, 30));
    expect(deleteCalled).toBe(false);
    confirmSpy.mockRestore();
  });
});
