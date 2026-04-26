import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SUPPORTED = ['en', 'es'] as const;
type SupportedLng = (typeof SUPPORTED)[number];

const normalize = (lng: string | undefined): SupportedLng =>
  lng && lng.toLowerCase().startsWith('es') ? 'es' : 'en';

/**
 * Toggle de idioma — alterna entre los soportados (en / es) y persiste la
 * elección via i18next-browser-languagedetector (localStorage). El default
 * inicial sigue saliendo del browser hasta que el usuario hace click.
 */
export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const current = normalize(i18n.language);
  const next: SupportedLng = current === 'es' ? 'en' : 'es';
  const label = t('languageSwitcher.toggleTo', { lang: next.toUpperCase() });

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      title={label}
      aria-label={label}
      data-testid="lang-switch"
      className="group flex items-center gap-1.5 p-2 text-muted-foreground transition-colors hover:text-white"
    >
      <Globe className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
        {current}
      </span>
    </button>
  );
};
