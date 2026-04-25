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

        const largeShiftsList = Array.from({ length: 400 }, (_, i) => ({
            id: `shift-bench-${i}`,
            employeeId: `emp-bench-${Math.floor(i / 2)}`,
            startTime: '10:00',
            endTime: '14:00',
            roleRequired: i % 2 === 0 ? 'Chef' : 'Waiter',
            status: 'assigned' as const,
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
        const { container } = renderWithProviders(<ScheduleGrid />)

        await waitFor(() =>
            expect(container.innerHTML).toContain('Load Tester 199'),
        )
        const end = performance.now()
        const renderTimeMs = end - start

        console.log(
            `⏱️ Rendered 200 employees + 400 shifts in ${renderTimeMs.toFixed(2)}ms`,
        )
        expect(renderTimeMs).toBeLessThan(3000) // jsdom + esperar useEffect+setState
    })
})
