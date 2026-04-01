import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { CoverageAlertWidget } from '../InitialWidgets'
import { useScheduleStore } from '../../../store/scheduleStore'

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}))

describe('CoverageAlertWidget with Real-Time State', () => {
    beforeEach(() => {
        // Clear store before each test
        act(() => {
            useScheduleStore.setState({ incidents: [] })
        })
    })

    it('renders "All Clear" state when there are no incidents', () => {
        const { container } = render(<CoverageAlertWidget />)
        expect(container.innerHTML).toContain('All Clear')
        expect(container.innerHTML).toContain('No Active Incidents')
    })

    it('renders incident count and list when incidents are present', () => {
        // Hydrate store with test data
        act(() => {
            useScheduleStore.getState().addIncident({ message: 'Kitchen understaffed', severity: 'critical' })
            useScheduleStore.getState().addIncident({ message: 'Late arrival', severity: 'warning' })
        })

        const { container } = render(<CoverageAlertWidget />)

        // Assert count rendering string like "2 Incidents"
        expect(container.innerHTML).toContain('2')
        // Assert incident messages are rendered in the list
        expect(container.innerHTML).toContain('Kitchen understaffed')
        expect(container.innerHTML).toContain('Late arrival')
    })
})
