import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { EmployeeRow } from '../EmployeeRow'
import type { Employee, Shift } from '../../../store/scheduleStore'

/**
 * Mock estable del store. `mockState` se mutía por test antes del render
 * para inyectar shifts específicos. `useScheduleStore(selector)` resuelve
 * el selector contra el state mock — coincide con el contrato real.
 */
const mockState = {
  shifts: [] as Shift[],
  addShift: vi.fn(),
  removeShift: vi.fn(),
}

vi.mock('../../../store/scheduleStore', () => ({
  useScheduleStore: <T,>(selector?: (s: typeof mockState) => T) =>
    (selector ? selector(mockState) : mockState) as T,
}))

describe('EmployeeRow Visual Validators', () => {
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00']
  const mockEmployee: Employee = {
    id: '1',
    name: 'Test Employee',
    role: 'Waiter',
    skills: ['waiter'],
  }

  beforeEach(() => {
    mockState.shifts = []
  })

  it('renders shift with standard status when skills match', () => {
    mockState.shifts = [
      {
        id: 's1',
        employeeId: '1',
        startTime: '08:00',
        endTime: '12:00',
        roleRequired: 'waiter',
        status: 'assigned',
      },
    ]

    const { container } = render(
      <EmployeeRow employee={mockEmployee} hours={hours} />,
    )

    expect(container.innerHTML).not.toContain('bg-destructive/20')
    expect(container.innerHTML).toContain('waiter')
  })

  it('renders shift with conflict status when skills DO NOT match', () => {
    mockState.shifts = [
      {
        id: 's2',
        employeeId: '1',
        startTime: '08:00',
        endTime: '12:00',
        roleRequired: 'cook',
        status: 'assigned',
      },
    ]

    const { container } = render(
      <EmployeeRow employee={mockEmployee} hours={hours} />,
    )

    expect(container.innerHTML).toContain('bg-destructive/20')
    expect(container.innerHTML).toContain('cook')
  })
})
