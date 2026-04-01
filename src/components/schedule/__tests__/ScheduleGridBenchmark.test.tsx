import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ScheduleGrid } from '../ScheduleGrid'
import { useScheduleStore } from '../../../store/scheduleStore'
import { act } from 'react'

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}))

describe('ScheduleGrid Performance Benchmark', () => {
    it('renders 200 employees without crashing and within reasonable time', () => {
        // Generate 200 mock employees
        const largeEmployeesList = Array.from({ length: 200 }, (_, i) => ({
            id: `emp-bench-${i}`,
            name: `Load Tester ${i}`,
            role: i % 2 === 0 ? 'Chef' : 'Waiter',
            skills: i % 2 === 0 ? ['chef', 'prep'] : ['waiter', 'host'],
            maxHoursPerWeek: 40
        }))

        // Generate 400 mock shifts (2 per employee)
        const largeShiftsList = Array.from({ length: 400 }, (_, i) => ({
            id: `shift-bench-${i}`,
            employeeId: `emp-bench-${Math.floor(i / 2)}`,
            startTime: '10:00',
            endTime: '14:00',
            roleRequired: i % 2 === 0 ? 'Chef' : 'Waiter',
            status: 'assigned' as const
        }))

        // Load into store directly
        act(() => {
            useScheduleStore.setState({
                employees: largeEmployeesList,
                shifts: largeShiftsList,
                loadMockData: () => { } // prevent ScheduleGrid mount from resetting to default mock data
            })
        })

        const start = performance.now()

        const { container } = render(<ScheduleGrid />)

        const end = performance.now()
        const renderTimeMs = end - start

        // Verify the 200th employee rendered
        expect(container.innerHTML).toContain('Load Tester 199')

        // Render time should ideally be under 500ms for 200 memoized nodes in JSDOM, 
        // though JSDOM is slower than real browsers. We just ensure it completes and is measured.
        console.log(`⏱️ Rendered 200 employees + 400 shifts in ${renderTimeMs.toFixed(2)}ms`)
        expect(renderTimeMs).toBeLessThan(1500) // generous upper bound for CI/CLI environments
    })
})
