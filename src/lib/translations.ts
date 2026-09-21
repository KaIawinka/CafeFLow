import type { Locale } from '@/app/i18n/config';
import { getLocaleTranslations } from '@/app/i18n/catalog';

export type { Locale } from '@/app/i18n/config';

export function getTranslation(locale: Locale) {
  const { auth, common } = getLocaleTranslations(locale);

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
