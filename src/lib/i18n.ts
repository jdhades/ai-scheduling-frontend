import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '../locales/en/common.json';
import enErrors from '../locales/en/errors.json';
import enNav from '../locales/en/nav.json';
import enLegacy from '../locales/en/legacy.json';
import enPolicies from '../locales/en/policies.json';
import enTemplates from '../locales/en/templates.json';
import enWorkforce from '../locales/en/workforce.json';
import enScheduling from '../locales/en/scheduling.json';
import enRules from '../locales/en/rules.json';
import enDashboard from '../locales/en/dashboard.json';
import enApprovals from '../locales/en/approvals.json';
import enInsights from '../locales/en/insights.json';

import esCommon from '../locales/es/common.json';
import esErrors from '../locales/es/errors.json';
import esNav from '../locales/es/nav.json';
import esLegacy from '../locales/es/legacy.json';
import esPolicies from '../locales/es/policies.json';
import esTemplates from '../locales/es/templates.json';
import esWorkforce from '../locales/es/workforce.json';
import esScheduling from '../locales/es/scheduling.json';
import esRules from '../locales/es/rules.json';
import esDashboard from '../locales/es/dashboard.json';
import esApprovals from '../locales/es/approvals.json';
import esInsights from '../locales/es/insights.json';

/**
 * Default language is English. The detector intentionally OMITS
 * `navigator`: we don't want the app to flip to Spanish just because the
 * browser locale happens to be `es-AR`. Users land on EN and keep it
 * unless they toggle via <LanguageSwitcher>, which persists their
 * choice in localStorage.
 *
 * `htmlTag` stays as a last-resort hint for embedded contexts where
 * the host page sets `<html lang="…">` explicitly.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    load: 'languageOnly',
    ns: [
      'common',
      'errors',
      'nav',
      'legacy',
      'policies',
      'templates',
      'workforce',
      'scheduling',
      'rules',
      'dashboard',
      'approvals',
      'insights',
    ],
    defaultNS: 'common',
    fallbackNS: ['common', 'legacy', 'nav'],
    resources: {
      en: {
        common: enCommon,
        errors: enErrors,
        nav: enNav,
        legacy: enLegacy,
        policies: enPolicies,
        templates: enTemplates,
        workforce: enWorkforce,
        scheduling: enScheduling,
        rules: enRules,
        dashboard: enDashboard,
        approvals: enApprovals,
        insights: enInsights,
      },
      es: {
        common: esCommon,
        errors: esErrors,
        nav: esNav,
        legacy: esLegacy,
        policies: esPolicies,
        templates: esTemplates,
        workforce: esWorkforce,
        scheduling: esScheduling,
        rules: esRules,
        dashboard: esDashboard,
        approvals: esApprovals,
        insights: esInsights,
      },
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
