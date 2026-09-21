import type { Locale } from '@/app/i18n/config';
import ruUi from '@/app/i18n/locales/ru/ui.json';
import enUi from '@/app/i18n/locales/en/ui.json';
import kgUi from '@/app/i18n/locales/kg/ui.json';
import ruAdmin from '@/app/i18n/locales/ru/admin.json';
import enAdmin from '@/app/i18n/locales/en/admin.json';
import kgAdmin from '@/app/i18n/locales/kg/admin.json';

type UiTranslations = {
  header: {
    kitchen: string;
    admin: string;
    orders: string;
    lightTheme: string;
    darkTheme: string;
    profile: string;
    settings: string;
    logout: string;
    confirmLogout: string;
    loggingOut: string;
    home: string;
    login: string;
    register: string;
    language: string;
    openMenu: string;
    closeMenu: string;
    avatar: string;
  };
  profile: {
    roleLabels: Record<string, string>;
    avatarAlt: string;
    welcome: string;
    photo: string;
    uploadError: string;
    avatarUpdated: string;
    awaitingApproval: string;
    loadError: string;
    profileTab: string;
    settingsTab: string;
    firstName: string;
    lastName: string;
    displayName: string;
    about: string;
    aboutPlaceholder: string;
    phone: string;
    timezone: string;
    telegramConnected: string;
    registration: string;
    lastLogin: string;
    saveProfile: string;
    saving: string;
    notifications: string;
    emailNotifications: string;
    smsNotifications: string;
    pushNotifications: string;
    telegramNotifications: string;
    privacy: string;
    showOnlineStatus: string;
    showPhone: string;
    showEmail: string;
    compactMode: string;
    saveSettings: string;
  };
  admin: typeof ruAdmin.panel;
  notFound: {
    title: string;
    description: string;
    home: string;
    contact: string;
  };
};

const translationSources = {
  ru: {
    ui: ruUi,
    admin: ruAdmin,
  },
  en: {
    ui: enUi,
    admin: enAdmin,
  },
  kg: {
    ui: kgUi,
    admin: kgAdmin,
  },
} satisfies Record<Locale, { ui: typeof ruUi; admin: typeof ruAdmin }>;

function buildUiTranslations(source: (typeof translationSources)[Locale]): UiTranslations {
  return {
    header: {
      kitchen: source.ui.header.kitchen,
      admin: source.ui.header.adminPanel,
      orders: source.ui.header.orders,
      lightTheme: source.ui.header.themeLight,
      darkTheme: source.ui.header.themeDark,
      profile: source.ui.header.profile,
      settings: source.ui.header.settings,
      logout: source.ui.header.logout,
      confirmLogout: source.ui.header.logoutConfirm,
      loggingOut: source.ui.header.loggingOut,
      home: source.ui.header.home,
      login: source.ui.header.login,
      register: source.ui.header.register,
      language: source.ui.header.language,
      openMenu: source.ui.header.openMenu,
      closeMenu: source.ui.header.closeMenu,
      avatar: source.ui.header.avatar,
    },
    profile: {
      roleLabels: source.ui.profile.roles,
      avatarAlt: source.ui.profile.title,
      welcome: `${source.ui.profile.welcome} ${source.ui.profile.welcomeMessage}`,
      photo: source.ui.profile.updatePhoto,
      uploadError: source.ui.profile.messages.avatarError,
      avatarUpdated: source.ui.profile.messages.avatarUpdated,
      awaitingApproval: source.ui.profile.awaitingApproval,
      loadError: source.ui.profile.loadingError,
      profileTab: source.ui.profile.profileTab,
      settingsTab: source.ui.profile.settingsTab,
      firstName: source.ui.profile.fields.firstName,
      lastName: source.ui.profile.fields.lastName,
      displayName: source.ui.profile.fields.displayName,
      about: source.ui.profile.fields.bio,
      aboutPlaceholder: source.ui.profile.fields.bioPlaceholder,
      phone: source.ui.profile.fields.phone,
      timezone: source.ui.profile.fields.timezone,
      telegramConnected: source.ui.profile.telegram.connected,
      registration: `${source.ui.profile.fields.createdAt}:`,
      lastLogin: `${source.ui.profile.fields.lastLogin}:`,
      saveProfile: source.ui.profile.buttons.save,
      saving: source.ui.profile.buttons.saving,
      notifications: source.ui.profile.notifications.title,
      emailNotifications: source.ui.profile.notifications.email,
      smsNotifications: source.ui.profile.notifications.sms,
      pushNotifications: source.ui.profile.notifications.push,
      telegramNotifications: source.ui.profile.notifications.telegram,
      privacy: source.ui.profile.privacy.title,
      showOnlineStatus: source.ui.profile.privacy.showOnlineStatus,
      showPhone: source.ui.profile.privacy.showPhone,
      showEmail: source.ui.profile.privacy.showEmail,
      compactMode: source.ui.profile.privacy.compactMode,
      saveSettings: source.ui.profile.buttons.saveSettings,
    },
    admin: source.admin.panel,
    notFound: {
      title: source.ui.notFound.title,
      description: source.ui.notFound.message,
      home: source.ui.notFound.goHome,
      contact: source.ui.notFound.contact,
    },
  };
}

export const uiTranslations: Record<Locale, UiTranslations> = {
  ru: buildUiTranslations(translationSources.ru),
  en: buildUiTranslations(translationSources.en),
  kg: buildUiTranslations(translationSources.kg),
};

export function getUiTranslations(locale: Locale): UiTranslations {
  return uiTranslations[locale] || uiTranslations.ru;
}
