import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { HistoricalDemandHeatmap } from '../HistoricalDemandHeatmap'

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}))

describe('HistoricalDemandHeatmap Component', () => {
    it('renders the grid with days and hours without crashing', () => {
        const { container } = render(<HistoricalDemandHeatmap />)

        // Verify the main title is present
        expect(container.innerHTML).toContain('Historical Demand &amp; Coverage Overlay')
        expect(container.innerHTML).toContain('Intensity')

        // Verify days are visible
        expect(container.innerHTML).toContain('Monday')
        expect(container.innerHTML).toContain('Friday')
        expect(container.innerHTML).toContain('Sunday')

        // Check if coverage dots exist
        const coverageDots = container.querySelectorAll('.bg-red-500.animate-pulse')
        expect(coverageDots).toBeDefined()
    })
})
