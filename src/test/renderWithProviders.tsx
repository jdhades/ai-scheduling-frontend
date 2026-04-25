import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';

interface ProvidersProps {
  children: ReactNode;
  /** Initial entries para el MemoryRouter. */
  initialEntries?: string[];
  /** QueryClient ya creado (default: nuevo, retry off, gcTime 0). */
  queryClient?: QueryClient;
}

const defaultClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

/**
 * Wrapper estándar para tests de componentes/integración que necesitan
 * Router y React Query. Retorna también el `queryClient` para tests que
 * quieran inspeccionar su cache.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: { initialEntries?: string[]; queryClient?: QueryClient } & Omit<
    RenderOptions,
    'wrapper'
  > = {},
) {
  const { initialEntries = ['/'], queryClient = defaultClient(), ...rest } = options;

  function Wrapper({ children }: ProvidersProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...rest }),
  };
}

/**
 * Variante sin Router — para tests unitarios de hooks que no dependen
 * de navegación.
 */
export function renderHookWithQueryClient(queryClient: QueryClient = defaultClient()) {
  function Wrapper({ children }: ProvidersProps) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: Wrapper, queryClient };
}
