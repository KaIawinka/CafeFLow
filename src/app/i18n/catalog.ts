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
import ruCafe from './locales/ru/cafe.json';
import enCafe from './locales/en/cafe.json';
import kgCafe from './locales/kg/cafe.json';
import ruUi from './locales/ru/ui.json';
import enUi from './locales/en/ui.json';
import kgUi from './locales/kg/ui.json';
import ruAdmin from './locales/ru/admin.json';
import enAdmin from './locales/en/admin.json';
import kgAdmin from './locales/kg/admin.json';
import ruApi from './locales/ru/api.json';
import enApi from './locales/en/api.json';
import kgApi from './locales/kg/api.json';

export type TranslationCatalog = {
  api: typeof ruApi;
  auth: typeof ruAuth;
  common: typeof ruCommon;
  landing: typeof ruLanding;
  dashboard: typeof ruDashboard;
  delivery: typeof ruDelivery;
  checkout: typeof ruCheckout;
  ui: typeof ruUi;
  admin: typeof ruAdmin;
  cafe: typeof ruCafe;
};

export const translationCatalog = {
  ru: { api: ruApi, auth: ruAuth, common: ruCommon, landing: ruLanding, dashboard: ruDashboard, delivery: ruDelivery, checkout: ruCheckout, cafe: ruCafe, ui: ruUi, admin: ruAdmin },
  en: { api: enApi, auth: enAuth, common: enCommon, landing: enLanding, dashboard: enDashboard, delivery: enDelivery, checkout: enCheckout, cafe: enCafe, ui: enUi, admin: enAdmin },
  kg: { api: kgApi, auth: kgAuth, common: kgCommon, landing: kgLanding, dashboard: kgDashboard, delivery: kgDelivery, checkout: kgCheckout, cafe: kgCafe, ui: kgUi, admin: kgAdmin },
} satisfies Record<Locale, TranslationCatalog>;

export function getLocaleTranslations(locale: Locale): TranslationCatalog {
  return translationCatalog[locale] || translationCatalog.ru;
}