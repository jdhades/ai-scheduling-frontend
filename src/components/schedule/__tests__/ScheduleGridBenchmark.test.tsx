import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { waitFor } from '@testing-library/react'
import { ScheduleGrid } from '../ScheduleGrid'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { server } from '../../../test/msw/server'
import { API_URL } from '../../../config'

describe('ScheduleGrid Performance Benchmark', () => {
    it('renders 200 employees without crashing and within reasonable time', async () => {
        const largeEmployeesList = Array.from({ length: 200 }, (_, i) => ({
            id: `emp-bench-${i}`,
            name: `Load Tester ${i}`,
            role: i % 2 === 0 ? 'Chef' : 'Waiter',
            skills: i % 2 === 0 ? ['chef', 'prep'] : ['waiter', 'host'],
            maxHoursPerWeek: 40,
        }))

        // Shape moderno (V3) que devuelve GET /schedules: array plano de
        // CompanyScheduleAssignmentDTO (templateId + actualStartTime/EndTime
        // ISO + templateName + origin). El parser de useScheduleQuery
        // adapta esto al shape Zustand.
        const largeShiftsList = Array.from({ length: 400 }, (_, i) => ({
            id: `shift-bench-${i}`,
            employeeId: `emp-bench-${Math.floor(i / 2)}`,
            templateId: `tpl-${i % 2 === 0 ? 'chef' : 'waiter'}`,
            templateName: i % 2 === 0 ? 'Chef' : 'Waiter',
            date: '2026-05-04',
            actualStartTime: '2026-05-04T10:00:00.000Z',
            actualEndTime: '2026-05-04T14:00:00.000Z',
            origin: 'membership' as const,
        }))

        // ScheduleGrid renderiza `employeesData || []` (no del store).
        // Para el benchmark devolvemos los 200 empleados desde la API.
        server.use(
            http.get(`${API_URL}/employees`, () =>
                HttpResponse.json(largeEmployeesList),
            ),
            http.get(`${API_URL}/schedules`, () =>
                HttpResponse.json(largeShiftsList),
            ),
            // ShiftTemplatesPanel también consulta /shift-templates
            http.get(`${API_URL}/shift-templates`, () => HttpResponse.json([])),
        )

        const start = performance.now()
        const { container } = renderWithProviders(<ScheduleGrid weekStart="2026-05-04" />)

        await waitFor(() =>
            expect(container.innerHTML).toContain('Load Tester 199'),
        )
        const end = performance.now()
        const renderTimeMs = end - start

        console.log(
            `⏱️ Rendered 200 employees + 400 shifts in ${renderTimeMs.toFixed(2)}ms`,
        )
        // jsdom + esperar useEffect+setState. Threshold permisivo para
        // evitar falsos negativos por jitter cuando se corre toda la
        // suite en paralelo.
        expect(renderTimeMs).toBeLessThan(8000)
    })
})
