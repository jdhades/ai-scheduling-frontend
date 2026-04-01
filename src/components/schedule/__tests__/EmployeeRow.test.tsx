import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { EmployeeRow } from '../EmployeeRow'
import { Employee, Shift } from '../../../store/scheduleStore'
import * as scheduleStoreParams from '../../../store/scheduleStore'

// Mock the Zustand store hook
vi.mock('../../../store/scheduleStore', () => ({
    useScheduleStore: vi.fn((selector) => {
        // Return dummy functions for addShift / removeShift
        return vi.fn()
    }),
}))

describe('EmployeeRow Visual Validators', () => {
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00']
    const mockEmployee: Employee = {
        id: '1',
        name: 'Test Employee',
        role: 'Waiter',
        skills: ['waiter'] // Lowercase for comparison in EmployeeRow
    }

    it('renders shift with standard status when skills match', () => {
        const matchingShift: Shift = {
            id: 's1',
            employeeId: '1',
            startTime: '08:00',
            endTime: '12:00',
            roleRequired: 'waiter', // Matches skills
            status: 'assigned'
        }

        const { container } = render(
            <EmployeeRow employee={mockEmployee} shifts={[matchingShift]} hours={hours} />
        )

        // Find the ShiftCell container by checking it doesn't have the conflict class (bg-destructive/20)
        // Note: the text we are looking for is the role
        expect(container.innerHTML).not.toContain('bg-destructive/20')
        expect(container.innerHTML).toContain('waiter')
    })

    it('renders shift with conflict status when skills DO NOT match', () => {
        const conflictingShift: Shift = {
            id: 's2',
            employeeId: '1',
            startTime: '08:00',
            endTime: '12:00',
            roleRequired: 'cook', // DOES NOT Match skills
            status: 'assigned'
        }

        const { container } = render(
            <EmployeeRow employee={mockEmployee} shifts={[conflictingShift]} hours={hours} />
        )

        // Find the ShiftCell container by checking it HAS the conflict class (bg-destructive/20)
        expect(container.innerHTML).toContain('bg-destructive/20')
        expect(container.innerHTML).toContain('cook')
    })
})
