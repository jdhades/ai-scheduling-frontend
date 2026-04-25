/**
 * Configuración global del frontend.
 *
 * Multi-tenancy: hasta tener login real, el `companyId` queda hardcodeado
 * en `TENANT_ID`. Cuando se agregue auth, esta constante se reemplaza por
 * un selector / lookup desde el JWT.
 *
 * `API_URL` lee `import.meta.env.VITE_API_URL` con fallback a localhost.
 */
export const TENANT_ID = '11111111-2222-3333-4444-555555555555';

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';
