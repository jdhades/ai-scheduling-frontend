import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { GeneratePage } from '../GeneratePage';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/msw/server';
import { API_URL } from '../../../config';

describe('GeneratePage', () => {
  it('dispara la mutación y muestra el resumen', async () => {
    server.use(
      http.post(`${API_URL}/schedules/generate`, () =>
        HttpResponse.json({
          assignmentsCount: 25,
          unfilledShiftsCount: 0,
          llmAccepted: 25,
          algorithmCorrected: 0,
          explanation: 'Horario generado para la semana del 2026-04-27.',
          warnings: ['Turno Diurno underfilled el 2026-04-22.'],
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<GeneratePage />);

    // El input se inicializa con el próximo lunes; lo sobreescribimos.
    const input = screen.getByTestId('g-week-input');
    await user.clear(input);
    await user.type(input, '2026-04-27');

    await user.click(screen.getByTestId('g-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('g-result')).toBeInTheDocument(),
    );
    // "25" aparece en assignmentsCount y llmAccepted.
    expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Horario generado/i)).toBeInTheDocument();
    expect(
      screen.getByText('Turno Diurno underfilled el 2026-04-22.'),
    ).toBeInTheDocument();
  });

  it('muestra error cuando el backend falla', async () => {
    server.use(
      http.post(`${API_URL}/schedules/generate`, () =>
        HttpResponse.json({ message: 'failed' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<GeneratePage />);

    await user.click(screen.getByTestId('g-submit'));

    await waitFor(() =>
      expect(screen.getByText(/Error:/i)).toBeInTheDocument(),
    );
  });
});
