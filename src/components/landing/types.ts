export interface LandingTranslations {
  hero: {
    title: string;
    subtitle: string;
    cta: {
      menu: string;
      reserve: string;
    };
  };
  menu: {
    title: string;
    subtitle: string;
    viewAll: string;
  };
  about: {
    title: string;
    description: string;
  };
  features: {
    menuEyebrow: string;
    story: {
      eyebrow: string;
      text: string;
      fresh: string;
      daily: string;
      chefs: string;
      experience: string;
      ambience: string;
      meetings: string;
      service: string;
      wait: string;
      years: string;
    };
    dishes: Array<{
      name: string;
      description: string;
      label: string;
    }>;
  };
  promotions: {
    items: Array<{
      eyebrow: string;
      title: string;
      detail: string;
      action: string;
      tag: string;
    }>;
    previous: string;
    next: string;
    slide: string;
  };
  reservation: {
    title: string;
    subtitle: string;
    button: string;
    eyebrow: string;
  };
  contact: {
    title: string;
    address: string;
    phone: string;
    hours: string;
  };
  footer: {
    menu: string;
    reservation: string;
    about: string;
    contact: string;
    rights: string;
    contacts: string;
    hours: string;
    address: string;
    weekdays: string;
    weekends: string;
    open: string;
  };
}