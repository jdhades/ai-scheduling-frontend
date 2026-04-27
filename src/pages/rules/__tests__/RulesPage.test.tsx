import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RulesPage } from '../RulesPage';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/msw/server';
import { API_URL } from '../../../config';

const rule = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'r1',
  ruleText: 'Pablo no trabaja los lunes',
  priorityLevel: 2,
  ruleType: 'restriction',
  isActive: true,
  expiresAt: null,
  createdAt: '2026-04-01T00:00:00Z',
  hasEmbedding: true,
  hasStructure: true,
  ...over,
});

describe('RulesPage', () => {
  it('lista reglas y resuelve labels de prioridad', async () => {
    server.use(
      http.get(`${API_URL}/rules/semantic`, () =>
        HttpResponse.json([
          rule(),
          rule({ id: 'r2', priorityLevel: 3, ruleText: 'Prefiere mañana' }),
        ]),
      ),
    );

    renderWithProviders(<RulesPage />);

    await waitFor(() =>
      expect(screen.getByText('Pablo no trabaja los lunes')).toBeInTheDocument(),
    );
    expect(screen.getByText('Prefiere mañana')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByText('Soft')).toBeInTheDocument();
  });

  it('crea una regla end-to-end', async () => {
    let listCalls = 0;
    let postBody: unknown;
    server.use(
      http.get(`${API_URL}/rules/semantic`, () => {
        listCalls += 1;
        return HttpResponse.json(listCalls === 1 ? [] : [rule({ id: 'new' })]);
      }),
      http.post(`${API_URL}/rules/semantic`, async ({ request }) => {
        postBody = await request.json();
        return HttpResponse.json(
          {
            id: 'new',
            embeddingGenerated: true,
            isDuplicate: false,
            structureExtracted: true,
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RulesPage />);

    await waitFor(() =>
      expect(screen.getByText('No hay reglas todavía.')).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId('new-rule-btn'));
    await user.type(
      screen.getByTestId('r-text-input'),
      'Pablo no trabaja los lunes',
    );
    await user.selectOptions(screen.getByTestId('r-priority-select'), '2');
    await user.selectOptions(screen.getByTestId('r-type-select'), 'restriction');
    await user.click(screen.getByTestId('r-submit'));

    await waitFor(() =>
      expect(postBody).toMatchObject({
        ruleText: 'Pablo no trabaja los lunes',
        priorityLevel: 2,
        ruleType: 'restriction',
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByText('Pablo no trabaja los lunes'),
      ).toBeInTheDocument(),
    );
  });

  it('PATCH metadata cambia activa + expiresAt sin tocar el texto', async () => {
    let patchBody: unknown;
    server.use(
      http.get(`${API_URL}/rules/semantic`, () => HttpResponse.json([rule()])),
      http.patch(`${API_URL}/rules/semantic/r1`, async ({ request }) => {
        patchBody = await request.json();
        return HttpResponse.text('', { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RulesPage />);

    await waitFor(() =>
      expect(screen.getByText('Pablo no trabaja los lunes')).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId('edit-meta-r1'));
    await user.click(screen.getByTestId('meta-active-cb')); // toggle off
    await user.type(screen.getByTestId('meta-expires-input'), '2026-12-31');
    await user.click(screen.getByTestId('meta-submit'));

    await waitFor(() =>
      expect(patchBody).toMatchObject({
        isActive: false,
      }),
    );
  });

  it('PATCH text requiere checkbox de confirmación', async () => {
    let patchCalled = false;
    server.use(
      http.get(`${API_URL}/rules/semantic`, () => HttpResponse.json([rule()])),
      http.patch(`${API_URL}/rules/semantic/r1/text`, () => {
        patchCalled = true;
        return HttpResponse.json({
          ruleId: 'r1',
          embeddingRegenerated: true,
          structureRegenerated: true,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RulesPage />);

    await waitFor(() =>
      expect(screen.getByText('Pablo no trabaja los lunes')).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId('edit-text-r1'));
    // Sin tildar el checkbox, el botón submit está deshabilitado.
    expect(screen.getByTestId('rt-submit')).toBeDisabled();
    // Cambiamos el texto y tildamos el confirm.
    await user.clear(screen.getByTestId('rt-text-input'));
    await user.type(screen.getByTestId('rt-text-input'), 'Pablo descansa los lunes');
    await user.click(screen.getByTestId('rt-confirm-cb'));
    await user.click(screen.getByTestId('rt-submit'));

    await waitFor(() => expect(patchCalled).toBe(true));
  });

  it('cuando el LLM detecta duplicado, el dialog queda abierto con el ID existente', async () => {
    server.use(
      http.get(`${API_URL}/rules/semantic`, () => HttpResponse.json([])),
      http.post(`${API_URL}/rules/semantic`, () =>
        HttpResponse.json(
          {
            id: 'existing-1',
            embeddingGenerated: false,
            isDuplicate: true,
            duplicateOfId: 'existing-1',
            structureExtracted: true,
          },
          { status: 201 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<RulesPage />);

    await waitFor(() =>
      expect(screen.getByText('No hay reglas todavía.')).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId('new-rule-btn'));
    await user.type(
      screen.getByTestId('r-text-input'),
      'Pablo no trabaja los lunes',
    );
    await user.click(screen.getByTestId('r-submit'));

    // No se cierra: muestra el panel de resultado con el ID existente.
    await waitFor(() =>
      expect(screen.getByTestId('r-result-panel')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('r-duplicate-of-id')).toHaveTextContent(
      'existing-1',
    );
  });

  it('muestra badge "Sin estructura" cuando hasStructure=false', async () => {
    server.use(
      http.get(`${API_URL}/rules/semantic`, () =>
        HttpResponse.json([
          rule({ id: 'broken', ruleText: 'Texto raro', hasStructure: false }),
        ]),
      ),
    );

    renderWithProviders(<RulesPage />);

    await waitFor(() =>
      expect(screen.getByText('Texto raro')).toBeInTheDocument(),
    );
    expect(screen.getByText('Sin estructura')).toBeInTheDocument();
  });

  it('intent=complex con suggestions: el dialog muestra picker y al elegir re-submitea con el texto sugerido', async () => {
    const calls: Array<{ ruleText: string }> = [];
    server.use(
      http.get(`${API_URL}/rules/semantic`, () => HttpResponse.json([])),
      http.post(`${API_URL}/rules/semantic`, async ({ request }) => {
        const body = (await request.json()) as { ruleText: string };
        calls.push({ ruleText: body.ruleText });
        if (calls.length === 1) {
          // Primer submit → complex con sugerencias.
          return HttpResponse.json(
            {
              id: 'pending',
              embeddingGenerated: true,
              isDuplicate: false,
              structureExtracted: false,
              intent: 'complex',
              suggestions: [
                {
                  id: 's1',
                  suggestedText: 'Pablo no trabaja los lunes',
                  explanation: 'Sujeto + día concreto, intent block',
                  previewIntent: 'block',
                },
                {
                  id: 's2',
                  suggestedText: 'Sofía prefiere turnos de mañana',
                  explanation: 'Preferencia explícita',
                  previewIntent: 'preference',
                },
              ],
            },
            { status: 201 },
          );
        }
        // Segundo submit con el texto elegido → ahora sí, persistido.
        return HttpResponse.json(
          rule({ id: 'new', ruleText: body.ruleText }),
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RulesPage />);

    await waitFor(() =>
      expect(screen.getByText('No hay reglas todavía.')).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId('new-rule-btn'));
    await user.type(
      screen.getByTestId('r-text-input'),
      'el día después de pasado mañana es bueno',
    );
    await user.click(screen.getByTestId('r-submit'));

    // Aparece el picker.
    await waitFor(() =>
      expect(screen.getByTestId('r-suggestions-panel')).toBeInTheDocument(),
    );
    expect(
      screen.getByText('Pablo no trabaja los lunes'),
    ).toBeInTheDocument();

    // El usuario elige la primera.
    await user.click(screen.getByTestId('r-suggestion-0'));

    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1].ruleText).toBe('Pablo no trabaja los lunes');
  });

  it('elimina tras confirmar', async () => {
    let deleteCalled = false;
    server.use(
      http.get(`${API_URL}/rules/semantic`, () =>
        HttpResponse.json([rule({ id: 'd1', ruleText: 'A borrar.' })]),
      ),
      http.delete(`${API_URL}/rules/semantic/d1`, () => {
        deleteCalled = true;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    renderWithProviders(<RulesPage />);

    await waitFor(() => expect(screen.getByText('A borrar.')).toBeInTheDocument());
    await user.click(screen.getByTestId('delete-d1'));
    await waitFor(() => expect(deleteCalled).toBe(true));
    confirmSpy.mockRestore();
  });
});
