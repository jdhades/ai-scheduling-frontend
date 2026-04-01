import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { FairnessPanel } from '../FairnessPanel'

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

// Recharts ResponsiveContainer often needs mocking in jsdom environments
// because ResizeObserver is not defined by default.
vi.mock('recharts', async (importOriginal) => {
    const OriginalRecharts = await importOriginal<typeof import('recharts')>()
    return {
        ...OriginalRecharts,
        ResponsiveContainer: ({ children }: any) => (
            <OriginalRecharts.ResponsiveContainer width={800} height={800}>
                {children}
            </OriginalRecharts.ResponsiveContainer>
        )
    }
})

describe('FairnessPanel Component', () => {
    it('renders without crashing and displays the charts', () => {
        const { container } = render(<FairnessPanel />)

        // Verify the main title is present (using mock t function keys)
        expect(container.innerHTML).toContain('fairness.title')
        expect(container.innerHTML).toContain('fairness.barTitle')
        expect(container.innerHTML).toContain('fairness.radarTitle')

        // Verify that recharts generated some SVG elements
        const svgs = container.querySelectorAll('svg')
        expect(svgs.length).toBeGreaterThan(0)
    })
})
