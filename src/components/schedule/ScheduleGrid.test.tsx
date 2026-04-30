import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { ScheduleGrid } from './ScheduleGrid'
import { ShiftCell } from './ShiftCell'
import { renderWithProviders } from '../../test/renderWithProviders'
import { server } from '../../test/msw/server'
import { API_URL } from '../../config'

describe('ScheduleGrid Overview', () => {
    it('renderiza la grilla con empleados desde GET /employees', async () => {
        server.use(
            http.get(`${API_URL}/employees`, () =>
                HttpResponse.json([
                    { id: '1', name: 'Alice Smith', role: 'Senior Waitress', skills: ['waitress'] },
                ]),
            ),
            http.get(`${API_URL}/schedules`, () => HttpResponse.json([])),
            http.get(`${API_URL}/shift-templates`, () => HttpResponse.json([])),
        )

        renderWithProviders(<ScheduleGrid weekStart="2026-05-04" />)

        await waitFor(() =>
            expect(screen.getAllByText('Alice Smith').length).toBeGreaterThan(0),
        )
        expect(screen.getByText('8:00')).toBeInTheDocument()
        expect(screen.getByText('19:00')).toBeInTheDocument()
    })

    it('renders ShiftCell correctly based on status', () => {
        const { container, rerender } = render(
            <ShiftCell employeeName="John Doe" role="Cook" status="assigned" />,
        )

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Cook')).toBeInTheDocument()

        rerender(<ShiftCell employeeName="John Doe" role="Cook" status="conflict" />)
        expect(container.firstChild).toHaveClass('bg-destructive/20')
    })
})
