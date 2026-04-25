import '@testing-library/jest-dom/vitest';
import './src/lib/i18n';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './src/test/msw/server';

// jsdom no implementa ResizeObserver — lo necesitan Recharts y algunos
// componentes Radix.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver =
  MockResizeObserver;

// jsdom no implementa matchMedia — algunos hooks de Radix lo consultan.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// MSW: server lifecycle por suite global.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
