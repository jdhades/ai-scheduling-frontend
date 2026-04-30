import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CompanyPoliciesPage } from '../CompanyPoliciesPage';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/msw/server';
import { API_URL } from '../../../config';

const policy = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'p1',
  companyId: 'c1',
  text: '2 días de descanso para el empleado aparte del feriado',
  severity: 'hard',
  scope: { type: 'company', id: null },
  params: { days: 2, holidayCounts: false },
  interpreterId: 'min_rest_days_per_week',
  hasInterpreter: true,
  isActive: true,
  effectiveFrom: '2026-04-27',
  createdAt: '2026-04-27T00:00:00Z',
  createdBy: 'system:seed_20260427',
  ...over,
});

// Phase 14.3 — la página carga branches/departments/employees para
// poblar el selector de scope. Mockeamos endpoints vacíos por default.
const mockScopeEndpoints = () => {
  server.use(
    http.get(`${API_URL}/branches`, () => HttpResponse.json([])),
    http.get(`${API_URL}/departments`, () => HttpResponse.json([])),
    http.get(`${API_URL}/employees`, () => HttpResponse.json([])),
  );
};

describe('CompanyPoliciesPage', () => {
  beforeEach(() => {
    mockScopeEndpoints();
  });
  it('lista políticas con badge "Determinística" cuando tienen interpreter', async () => {
    server.use(
      http.get(`${API_URL}/company-policies`, () =>
        HttpResponse.json([policy(), policy({ id: 'p2', text: 'política llm-only', interpreterId: null, hasInterpreter: false, params: {} })]),
      ),
    );

    renderWithProviders(<CompanyPoliciesPage />);

    await waitFor(() =>
      expect(
        screen.getByText('2 días de descanso para el empleado aparte del feriado'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('Determinística')).toBeInTheDocument();
    expect(screen.getByText('LLM-only')).toBeInTheDocument();
  });

  it('camino feliz: el sistema matchea un interpreter, muestra panel "Política creada" y se cierra al confirmar', async () => {
    let listCalls = 0;
    server.use(
      http.get(`${API_URL}/company-policies`, () => {
        listCalls += 1;
        return HttpResponse.json(
          listCalls === 1 ? [] : [policy({ id: 'new', text: 'nueva política' })],
        );
      }),
      http.post(`${API_URL}/company-policies`, () =>
        HttpResponse.json(
          {
            status: 'created',
            policy: policy({ id: 'new', text: 'nueva política' }),
          },
          { status: 201 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<CompanyPoliciesPage />);

    await waitFor(() =>
      expect(screen.getByText('No hay políticas todavía.')).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId('new-policy-btn'));
    await user.type(
      screen.getByTestId('policy-text-input'),
      'cada empleado descansa al menos 2 días por semana',
    );
    await user.click(screen.getByTestId('policy-submit'));

    // Phase 14 — el dialog ya no cierra solo. Muestra el panel
    // `created-info` con el tipo de enforcement; el manager confirma
    // con "Entendido".
    await waitFor(() =>
      expect(screen.getByTestId('created-info-close')).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId('created-info-close'));
    await waitFor(() => expect(screen.getByText('nueva política')).toBeInTheDocument());
    expect(screen.queryByTestId('policy-text-input')).not.toBeInTheDocument();
  });

  it('needs_clarification: muestra sugerencias y, al elegir una, re-submitea con el texto elegido', async () => {
    const calls: Array<{ text: string }> = [];
    server.use(
      http.get(`${API_URL}/company-policies`, () => HttpResponse.json([])),
      http.post(`${API_URL}/company-policies`, async ({ request }) => {
        const body = (await request.json()) as { text: string };
        calls.push({ text: body.text });
        if (calls.length === 1) {
          // Primer submit → no matchea, devuelve sugerencias.
          return HttpResponse.json(
            {
              status: 'needs_clarification',
              reason: 'no_interpreter_matched',
              suggestions: [
                {
                  id: 's1',
                  suggestedText: 'Cada empleado debe tener al menos 2 días libres por semana',
                  matchedInterpreterId: 'min_rest_days_per_week',
                  matchedParams: { days: 2, holidayCounts: true },
                  explanation: 'Reformulada al patrón de mínimo días libres semanales.',
                },
                {
                  id: 's2',
                  suggestedText: 'Los empleados descansan 3 días por semana',
                  matchedInterpreterId: 'min_rest_days_per_week',
                  matchedParams: { days: 3, holidayCounts: true },
                  explanation: 'Variante con 3 días.',
                },
              ],
            },
            { status: 201 },
          );
        }
        // Segundo submit → la sugerencia elegida ya matchea, persiste.
        return HttpResponse.json(
          {
            status: 'created',
            policy: policy({ id: 'new', text: body.text }),
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<CompanyPoliciesPage />);

    await waitFor(() =>
      expect(screen.getByText('No hay políticas todavía.')).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId('new-policy-btn'));
    await user.type(
      screen.getByTestId('policy-text-input'),
      'que descansen aparte del feriado',
    );
    await user.click(screen.getByTestId('policy-submit'));

    // Aparecen las 2 sugerencias.
    await waitFor(() =>
      expect(screen.getByTestId('policy-suggestions')).toBeInTheDocument(),
    );
    expect(
      screen.getByText('Cada empleado debe tener al menos 2 días libres por semana'),
    ).toBeInTheDocument();

    // El usuario elige la primera.
    await user.click(screen.getByTestId('suggestion-0'));

    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1].text).toBe(
      'Cada empleado debe tener al menos 2 días libres por semana',
    );
  });

  it('LLM-only warning: cuando se guarda sin interpreter, muestra el panel y queda abierto', async () => {
    server.use(
      http.get(`${API_URL}/company-policies`, () => HttpResponse.json([])),
      http.post(`${API_URL}/company-policies`, () =>
        HttpResponse.json(
          {
            status: 'created',
            policy: policy({
              id: 'new',
              text: 'política rara',
              interpreterId: null,
              hasInterpreter: false,
              params: {},
            }),
          },
          { status: 201 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<CompanyPoliciesPage />);

    await waitFor(() =>
      expect(screen.getByText('No hay políticas todavía.')).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId('new-policy-btn'));
    await user.type(
      screen.getByTestId('policy-text-input'),
      'política rara que el sistema no puede aplicar',
    );
    await user.click(screen.getByTestId('policy-submit'));

    // Phase 14 — el panel se llama `created-info` ahora; para policies
    // sin interpreter (LLM-only puro) muestra warning de "sin garantía".
    await waitFor(() =>
      expect(screen.getByTestId('created-info-close')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('policy-created-info')).toBeInTheDocument();
    expect(screen.getByText(/LLM-only/i)).toBeInTheDocument();
    expect(screen.queryByTestId('policy-text-input')).not.toBeInTheDocument();
  });

  it('elimina tras confirmar', async () => {
    let deleted = false;
    server.use(
      http.get(`${API_URL}/company-policies`, () =>
        HttpResponse.json([policy({ id: 'del-1' })]),
      ),
      http.delete(`${API_URL}/company-policies/del-1`, () => {
        deleted = true;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    renderWithProviders(<CompanyPoliciesPage />);

    await waitFor(() => expect(screen.getByTestId('delete-del-1')).toBeInTheDocument());
    await user.click(screen.getByTestId('delete-del-1'));

    await waitFor(() => expect(deleted).toBe(true));
    confirmSpy.mockRestore();
  });

  it('toggle isActive llama PATCH con el flag invertido', async () => {
    let patchBody: unknown;
    server.use(
      http.get(`${API_URL}/company-policies`, () =>
        HttpResponse.json([policy({ id: 'tog-1', isActive: true })]),
      ),
      http.patch(`${API_URL}/company-policies/tog-1`, async ({ request }) => {
        patchBody = await request.json();
        return HttpResponse.json(policy({ id: 'tog-1', isActive: false }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<CompanyPoliciesPage />);

    await waitFor(() => expect(screen.getByTestId('toggle-tog-1')).toBeInTheDocument());
    await user.click(screen.getByTestId('toggle-tog-1'));

    await waitFor(() => expect(patchBody).toEqual({ isActive: false }));
  });
});
