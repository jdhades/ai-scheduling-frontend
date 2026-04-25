import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MembershipsPage } from '../MembershipsPage';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/msw/server';
import { API_URL } from '../../../config';

const seedListEndpoints = (
  memberships: unknown[] = [],
  employees: unknown[] = [],
  templates: unknown[] = [],
) => {
  server.use(
    http.get(`${API_URL}/shift-memberships`, () =>
      HttpResponse.json(memberships),
    ),
    http.get(`${API_URL}/employees`, () => HttpResponse.json(employees)),
    http.get(`${API_URL}/shift-templates`, () => HttpResponse.json(templates)),
  );
};

describe('MembershipsPage', () => {
  it('renderiza memberships con nombres resueltos', async () => {
    seedListEndpoints(
      [
        {
          id: 'm1',
          companyId: 'c',
          employeeId: 'e1',
          templateId: 't1',
          effectiveFrom: '2026-01-01',
          effectiveUntil: null,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      [{ id: 'e1', name: 'Ana', role: 'employee' }],
      [
        {
          id: 't1',
          name: 'Diurno',
          dayOfWeek: 1,
          startTime: '08:00:00',
          endTime: '16:00:00',
          requiredSkillId: null,
          demandScore: 1,
          undesirableWeight: 0,
          isActive: true,
        },
      ],
    );

    renderWithProviders(<MembershipsPage />);

    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument());
    expect(screen.getByText('Diurno')).toBeInTheDocument();
    expect(screen.getByText('2026-01-01')).toBeInTheDocument();
    expect(screen.getByText('abierto')).toBeInTheDocument();
  });

  it('estado vacío', async () => {
    seedListEndpoints();
    renderWithProviders(<MembershipsPage />);
    await waitFor(() =>
      expect(
        screen.getByText('No hay memberships todavía.'),
      ).toBeInTheDocument(),
    );
  });

  it('crea un membership end-to-end', async () => {
    let listCalls = 0;
    let postBody: unknown;
    server.use(
      http.get(`${API_URL}/shift-memberships`, () => {
        listCalls += 1;
        return HttpResponse.json(
          listCalls === 1
            ? []
            : [
                {
                  id: 'new',
                  companyId: 'c',
                  employeeId: 'e1',
                  templateId: 't1',
                  effectiveFrom: '2026-04-01',
                  effectiveUntil: null,
                  createdAt: '2026-04-01T00:00:00Z',
                },
              ],
        );
      }),
      http.get(`${API_URL}/employees`, () =>
        HttpResponse.json([{ id: 'e1', name: 'Ana', role: 'employee' }]),
      ),
      http.get(`${API_URL}/shift-templates`, () =>
        HttpResponse.json([
          {
            id: 't1',
            name: 'Diurno',
            dayOfWeek: 1,
            startTime: '08:00:00',
            endTime: '16:00:00',
            requiredSkillId: null,
            demandScore: 1,
            undesirableWeight: 0,
            isActive: true,
          },
        ]),
      ),
      http.post(`${API_URL}/shift-memberships`, async ({ request }) => {
        postBody = await request.json();
        return HttpResponse.json({ id: 'new' }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MembershipsPage />);

    // El botón se habilita cuando employees y templates terminan de cargar.
    const newBtn = await screen.findByTestId('new-membership-btn');
    await waitFor(() => expect(newBtn).not.toBeDisabled());
    await user.click(newBtn);

    await user.selectOptions(screen.getByTestId('m-employee-select'), 'e1');
    await user.selectOptions(screen.getByTestId('m-template-select'), 't1');
    await user.clear(screen.getByTestId('m-from-input'));
    await user.type(screen.getByTestId('m-from-input'), '2026-04-01');
    await user.click(screen.getByTestId('m-submit'));

    await waitFor(() =>
      expect(postBody).toEqual({
        employeeId: 'e1',
        templateId: 't1',
        effectiveFrom: '2026-04-01',
        effectiveUntil: null,
      }),
    );
    await waitFor(() => expect(listCalls).toBeGreaterThanOrEqual(2));
  });

  it('elimina tras confirmar', async () => {
    let deleteCalled = false;
    server.use(
      http.get(`${API_URL}/shift-memberships`, () =>
        HttpResponse.json([
          {
            id: 'd1',
            companyId: 'c',
            employeeId: 'e1',
            templateId: 't1',
            effectiveFrom: '2026-01-01',
            effectiveUntil: null,
            createdAt: '2026-01-01T00:00:00Z',
          },
        ]),
      ),
      http.get(`${API_URL}/employees`, () =>
        HttpResponse.json([{ id: 'e1', name: 'Ana', role: 'employee' }]),
      ),
      http.get(`${API_URL}/shift-templates`, () => HttpResponse.json([])),
      http.delete(`${API_URL}/shift-memberships/d1`, () => {
        deleteCalled = true;
        return HttpResponse.text('', { status: 204 });
      }),
    );
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    renderWithProviders(<MembershipsPage />);

    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument());
    await user.click(screen.getByTestId('delete-d1'));

    await waitFor(() => expect(deleteCalled).toBe(true));
    confirmSpy.mockRestore();
  });
});
