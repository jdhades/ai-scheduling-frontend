import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ScheduleGrid } from './ScheduleGrid'
import { ShiftCell } from './ShiftCell'

describe('ScheduleGrid Overview', () => {
    it('renders the ScheduleGrid with dummy data', () => {
        render(<ScheduleGrid />)

        // Check if employee name from dummy data is present
        expect(screen.getAllByText('Alice Smith').length).toBeGreaterThan(0)
        // Check if hours are rendered
        expect(screen.getByText('8:00')).toBeInTheDocument()
        expect(screen.getByText('19:00')).toBeInTheDocument()
    })

    it('renders ShiftCell correctly based on status', () => {
        const { container, rerender } = render(
            <ShiftCell employeeName="John Doe" role="Cook" status="assigned" />
        )

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Cook')).toBeInTheDocument()

        // Rerender with conflict status
        rerender(<ShiftCell employeeName="John Doe" role="Cook" status="conflict" />)
        expect(container.firstChild).toHaveClass('bg-destructive/20')
    })
})
