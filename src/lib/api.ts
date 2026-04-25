import axios from 'axios';
import { API_URL, TENANT_ID } from '../config';

/**
 * Cliente axios compartido. Inyecta automáticamente:
 *   - baseURL desde `import.meta.env.VITE_API_URL`
 *   - header `X-Company-Id` con el tenant actual
 *   - query param `companyId` (back-compat con controllers que lo leen
 *     desde query — ej. shift-templates, rules)
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'X-Company-Id': TENANT_ID },
});

api.interceptors.request.use((cfg) => {
  cfg.params = { companyId: TENANT_ID, ...(cfg.params ?? {}) };
  return cfg;
});
