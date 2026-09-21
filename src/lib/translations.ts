import type { Locale } from '@/app/i18n/config';
import ruAuth from '@/app/i18n/locales/ru/auth.json';
import enAuth from '@/app/i18n/locales/en/auth.json';
import kgAuth from '@/app/i18n/locales/kg/auth.json';
import ruCommon from '@/app/i18n/locales/ru/common.json';
import enCommon from '@/app/i18n/locales/en/common.json';
import kgCommon from '@/app/i18n/locales/kg/common.json';

export type { Locale } from '@/app/i18n/config';

const authTranslations = {
  ru: ruAuth,
  en: enAuth,
  kg: kgAuth,
} satisfies Record<Locale, typeof ruAuth>;

const commonTranslations = {
  ru: ruCommon,
  en: enCommon,
  kg: kgCommon,
} satisfies Record<Locale, typeof ruCommon>;

export function getTranslation(locale: Locale) {
  const auth = authTranslations[locale] || authTranslations.ru;
  const common = commonTranslations[locale] || commonTranslations.ru;

  return {
    login: {
      ...auth.login,
      errors: auth.login.errors,
    },
    register: {
      ...auth.register,
      weak: auth.register.weak,
      medium: auth.register.medium,
      strong: auth.register.strong,
    },
    common: {
      cafeflow: common.auth.brand,
      createAccount: common.auth.createAccount,
      welcome: common.auth.welcome,
      twoFaConfirmation: common.auth.twoFaConfirmation,
      footerRights: common.footer.rights,
    },
  };
}
