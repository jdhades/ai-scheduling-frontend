import { http, HttpResponse } from 'msw';
import { API_URL } from '../../config';

/**
 * Handlers MSW por defecto. Cada test puede sobreescribir/agregar con
 * `server.use(...)` antes de su acción.
 *
 * Mantener acá SOLO los endpoints que tienen comportamiento "feliz" estable
 * y compartido. Para casos específicos (errores, paginación, etc.), usar
 * server.use en el test.
 */
export const defaultHandlers = [
  // Lista de empleados — vacía por default.
  http.get(`${API_URL}/employees`, () => HttpResponse.json([])),
];
