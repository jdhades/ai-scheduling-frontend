import axios from 'axios';
import i18n from './i18n';

interface BackendErrorBody {
  errorCode?: string;
  message?: string | string[];
  field?: string;
  constraint?: string;
}

/**
 * Devuelve un texto traducido y user-friendly para mostrar al usuario a
 * partir de cualquier error capturado.
 *
 * Convención backend: el orchestrator devuelve `errorCode` estable
 * (ej. `EMPLOYEE_PHONE_DUPLICATE`) que se busca en `errors.<code>` del
 * catálogo i18n. Si la traducción no existe o el backend no envía code,
 * cae al `message` que mande el backend, después al status, y por último
 * a un mensaje genérico traducido.
 */
export function describeApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = (err.response?.data ?? {}) as BackendErrorBody;

    if (data.errorCode) {
      const key = `errors.${data.errorCode}`;
      const params = {
        field: data.field ?? '',
        constraint: data.constraint ?? '',
      };
      const translated = i18n.t(key, params);
      // i18next devuelve la key tal cual cuando no hay traducción.
      if (translated !== key) return translated;
    }

    if (Array.isArray(data.message)) return data.message.join(' · ');
    if (data.message) return data.message;

    if (err.response?.status) {
      return i18n.t('errors.GENERIC_HTTP', { status: err.response.status });
    }
  }

  if (err instanceof Error && err.message) return err.message;

  return i18n.t('errors.UNKNOWN');
}
