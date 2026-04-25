import { setupServer } from 'msw/node';
import { defaultHandlers } from './handlers';

/**
 * Server MSW global usado por `vitest.setup.ts`. Comparte estado entre
 * tests; cada test resetea handlers en `afterEach`.
 */
export const server = setupServer(...defaultHandlers);
