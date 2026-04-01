import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CoverageHeatmap } from './CoverageHeatmap'

describe('CoverageHeatmap Interactivity and Rendering', () => {
    it('renders the heatmap header', () => {
        render(<CoverageHeatmap />)
        expect(screen.getByText('Weekly Coverage Heatmap')).toBeInTheDocument()
        // Check if days are rendered
        expect(screen.getByText('Monday')).toBeInTheDocument()
        expect(screen.getByText('Friday')).toBeInTheDocument()
    })

    it('handles click interactions on cells to show modal/details', () => {
        const { container } = render(<CoverageHeatmap />)

        // Find the first interactive cell inside the Day row
        // There are many cells, we will just click the first one that has the title attribute.
        const cells = container.querySelectorAll('.group\\/cell')
        expect(cells.length).toBeGreaterThan(0)

        // Click the first cell
        fireEvent.click(cells[0])

        // Check if the Selected text appeared
        expect(screen.getByText(/Selected: /i)).toBeInTheDocument()
        expect(screen.getByText(/Coverage: /i)).toBeInTheDocument()
    })
})
