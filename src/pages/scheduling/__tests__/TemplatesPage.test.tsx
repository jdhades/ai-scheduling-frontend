import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { TemplatesPage } from '../TemplatesPage';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/msw/server';
import { API_URL } from '../../../config';

const tpl = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 't1',
  name: 'Diurno',
  dayOfWeek: null,
  startTime: '08:00:00',
  endTime: '16:00:00',
  requiredSkillId: null,
  demandScore: 1,
  undesirableWeight: 0,
  isActive: true,
  requiredEmployees: 2,
  ...over,
});

describe('TemplatesPage', () => {
  it('lista templates con día / horario / required_employees', async () => {
    server.use(
      http.get(`${API_URL}/shift-templates`, () =>
        HttpResponse.json([
          tpl(),
          tpl({ id: 't2', name: 'Nocturno', requiredEmployees: null }),
        ]),
      ),
    );

    renderWithProviders(<TemplatesPage />);

    await waitFor(() => expect(screen.getByText('Diurno')).toBeInTheDocument());
    expect(screen.getByText('Nocturno')).toBeInTheDocument();
    // Día null → 'Todos'
    expect(screen.getAllByText('Todos').length).toBeGreaterThanOrEqual(1);
    // Horario formateado.
    expect(screen.getAllByText('08:00–16:00').length).toBeGreaterThanOrEqual(1);
    // required_employees = 2 vs elastic.
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('elastic')).toBeInTheDocument();
  });

  it('crea un template end-to-end', async () => {
    let listCalls = 0;
    let postBody: unknown;
    server.use(
      http.get(`${API_URL}/shift-templates`, () => {
        listCalls += 1;
        return HttpResponse.json(
          listCalls === 1 ? [] : [tpl({ id: 'new', name: 'Apertura' })],
        );
      }),
      http.post(`${API_URL}/shift-templates`, async ({ request }) => {
        postBody = await request.json();
        return HttpResponse.json(tpl({ id: 'new', name: 'Apertura' }), {
          status: 201,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<TemplatesPage />);

    await waitFor(() =>
      expect(screen.getByText('No hay templates todavía.')).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId('new-template-btn'));
    await user.type(screen.getByTestId('t-name-input'), 'Apertura');
    await user.selectOptions(screen.getByTestId('t-day-select'), '1'); // Lun
    await user.clear(screen.getByTestId('t-required-input'));
    await user.type(screen.getByTestId('t-required-input'), '3');
    await user.click(screen.getByTestId('t-submit'));

    await waitFor(() =>
      expect(postBody).toMatchObject({
        name: 'Apertura',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '16:00',
        requiredEmployees: 3,
      }),
    );
    await waitFor(() =>
      expect(screen.getByText('Apertura')).toBeInTheDocument(),
    );
  });

  it('elimina tras confirmar', async () => {
    let deleteCalled = false;
    server.use(
      http.get(`${API_URL}/shift-templates`, () =>
        HttpResponse.json([tpl({ id: 'd1', name: 'A borrar' })]),
      ),
      http.delete(`${API_URL}/shift-templates/d1`, () => {
        deleteCalled = true;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    renderWithProviders(<TemplatesPage />);

    await waitFor(() => expect(screen.getByText('A borrar')).toBeInTheDocument());
    await user.click(screen.getByTestId('delete-d1'));
    await waitFor(() => expect(deleteCalled).toBe(true));
    confirmSpy.mockRestore();
  });
});
