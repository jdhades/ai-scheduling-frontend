import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SkillsPage } from '../SkillsPage';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/msw/server';
import { API_URL } from '../../../config';

describe('SkillsPage', () => {
  it('lista skills', async () => {
    server.use(
      http.get(`${API_URL}/company-skills`, () =>
        HttpResponse.json([
          { id: 's1', companyId: 'c', name: 'barista' },
          { id: 's2', companyId: 'c', name: 'caja' },
        ]),
      ),
    );

    renderWithProviders(<SkillsPage />);

    await waitFor(() => expect(screen.getByText('barista')).toBeInTheDocument());
    expect(screen.getByText('caja')).toBeInTheDocument();
    expect(screen.getByText('2 skills')).toBeInTheDocument();
  });

  it('crea una skill end-to-end', async () => {
    let listCalls = 0;
    let postBody: unknown;
    server.use(
      http.get(`${API_URL}/company-skills`, () => {
        listCalls += 1;
        return HttpResponse.json(
          listCalls === 1
            ? []
            : [{ id: 'new', companyId: 'c', name: 'cocinero' }],
        );
      }),
      http.post(`${API_URL}/company-skills`, async ({ request }) => {
        postBody = await request.json();
        return HttpResponse.json(
          { id: 'new', companyId: 'c', name: 'cocinero' },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<SkillsPage />);

    await waitFor(() =>
      expect(screen.getByText('No hay skills todavía.')).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId('new-skill-btn'));
    await user.type(screen.getByTestId('skill-name-input'), 'cocinero');
    await user.click(screen.getByTestId('skill-submit'));

    await waitFor(() => expect(postBody).toEqual({ name: 'cocinero' }));
    await waitFor(() => expect(screen.getByText('cocinero')).toBeInTheDocument());
  });

  it('valida nombre vacío', async () => {
    server.use(
      http.get(`${API_URL}/company-skills`, () => HttpResponse.json([])),
    );

    const user = userEvent.setup();
    renderWithProviders(<SkillsPage />);

    await waitFor(() =>
      expect(screen.getByText('No hay skills todavía.')).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId('new-skill-btn'));
    // Insertamos espacios y submit; el form HTML5 required no bloquea espacios
    // pero nuestra validación los trim() y rechaza.
    const input = screen.getByTestId('skill-name-input');
    await user.type(input, '   ');
    // Disparamos submit programático porque el input no está vacío para HTML5.
    const form = input.closest('form')!;
    form.requestSubmit();

    await waitFor(() =>
      expect(screen.getByTestId('skill-form-error')).toHaveTextContent(
        'no puede estar vacío',
      ),
    );
  });

  it('elimina tras confirmar', async () => {
    let deleteCalled = false;
    server.use(
      http.get(`${API_URL}/company-skills`, () =>
        HttpResponse.json([{ id: 'd1', companyId: 'c', name: 'mesero' }]),
      ),
      http.delete(`${API_URL}/company-skills/d1`, () => {
        deleteCalled = true;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    renderWithProviders(<SkillsPage />);

    await waitFor(() => expect(screen.getByText('mesero')).toBeInTheDocument());
    await user.click(screen.getByTestId('delete-d1'));
    await waitFor(() => expect(deleteCalled).toBe(true));
    confirmSpy.mockRestore();
  });
});
