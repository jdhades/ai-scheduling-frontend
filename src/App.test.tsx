import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

/**
 * Smoke test del shell del app (post-F.1):
 *   - <App /> monta <RouterProvider /> con BrowserRouter interno.
 *   - El layout muestra el branding "AI Scheduling" + "Manager" en AppSidebar.
 *   - Los grupos colapsables del sidebar se enumeran.
 */
describe('App shell', () => {
  const renderApp = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    })
    return render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    )
  }

  it('renderiza el branding del sidebar', () => {
    renderApp()
    expect(screen.getByText('AI Scheduling')).toBeInTheDocument()
    expect(screen.getByText('Manager')).toBeInTheDocument()
  })

  it('expone los grupos de navegación del sidebar', () => {
    renderApp()
    for (const group of [
      'General',
      'Workforce',
      'Scheduling',
      'Rules',
      'Approvals',
      'Insights',
    ]) {
      expect(screen.getByText(group)).toBeInTheDocument()
    }
  })
})
