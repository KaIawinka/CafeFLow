export interface LandingTranslations {
  hero: {
    location: string;
    title: string;
    subtitle: string;
    ratingValue: string;
    ratingLabel: string;
    hoursValue: string;
    city: string;
    featuredDishLabel: string;
    featuredDishName: string;
    featuredDishPrice: string;
    localsBadge: string;
    freshBadge: string;
    discover: string;
    scrollToStory: string;
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
      experienceValue: string;
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
      price: string;
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
  contactForm: {
    title: string;
    subtitle: string;
    successTitle: string;
    successMessage: string;
    error: string;
    fields: {
      name: string;
      phone: string;
      email: string;
      company: string;
      message: string;
    };
    placeholders: {
      name: string;
      phone: string;
      email: string;
      company: string;
      message: string;
    };
    submit: string;
    submitting: string;
    privacyPrefix: string;
    privacyLink: string;
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