import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'

describe('App Dashboard Rendering', () => {
    it('renders the AI Scheduler header', () => {
        render(<App />)
        expect(screen.getByText('AI Scheduler')).toBeInTheDocument()
    })

    it('renders the initial widgets', () => {
        render(<App />)
        expect(screen.getByText('Current Schedule Status')).toBeInTheDocument()
        expect(screen.getByText('Active Incidents')).toBeInTheDocument()
    })
})
