import type { Locale } from './config';
import ruAuth from './locales/ru/auth.json';
import enAuth from './locales/en/auth.json';
import kgAuth from './locales/kg/auth.json';
import ruCommon from './locales/ru/common.json';
import enCommon from './locales/en/common.json';
import kgCommon from './locales/kg/common.json';
import ruLanding from './locales/ru/landing.json';
import enLanding from './locales/en/landing.json';
import kgLanding from './locales/kg/landing.json';
import ruDashboard from './locales/ru/dashboard.json';
import enDashboard from './locales/en/dashboard.json';
import kgDashboard from './locales/kg/dashboard.json';
import ruDelivery from './locales/ru/delivery.json';
import enDelivery from './locales/en/delivery.json';
import kgDelivery from './locales/kg/delivery.json';
import ruCheckout from './locales/ru/checkout.json';
import enCheckout from './locales/en/checkout.json';
import kgCheckout from './locales/kg/checkout.json';
import ruUi from './locales/ru/ui.json';
import enUi from './locales/en/ui.json';
import kgUi from './locales/kg/ui.json';
import ruAdmin from './locales/ru/admin.json';
import enAdmin from './locales/en/admin.json';
import kgAdmin from './locales/kg/admin.json';

export type TranslationCatalog = {
  auth: typeof ruAuth;
  common: typeof ruCommon;
  landing: typeof ruLanding;
  dashboard: typeof ruDashboard;
  delivery: typeof ruDelivery;
  checkout: typeof ruCheckout;
  ui: typeof ruUi;
  admin: typeof ruAdmin;
};

export const translationCatalog = {
  ru: { auth: ruAuth, common: ruCommon, landing: ruLanding, dashboard: ruDashboard, delivery: ruDelivery, checkout: ruCheckout, ui: ruUi, admin: ruAdmin },
  en: { auth: enAuth, common: enCommon, landing: enLanding, dashboard: enDashboard, delivery: enDelivery, checkout: enCheckout, ui: enUi, admin: enAdmin },
  kg: { auth: kgAuth, common: kgCommon, landing: kgLanding, dashboard: kgDashboard, delivery: kgDelivery, checkout: kgCheckout, ui: kgUi, admin: kgAdmin },
} satisfies Record<Locale, TranslationCatalog>;

export function getLocaleTranslations(locale: Locale): TranslationCatalog {
  return translationCatalog[locale] || translationCatalog.ru;
}