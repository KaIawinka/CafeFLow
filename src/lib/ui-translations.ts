import type { Locale } from '@/app/i18n/config';

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
  admin: {
    title: string;
    description: string;
    users: string;
    settings: string;
    stats: string;
    search: string;
    allRoles: string;
    administrators: string;
    managers: string;
    roleKitchen: string;
    employees: string;
    customers: string;
    user: string;
    email: string;
    role: string;
    status: string;
    registered: string;
    actions: string;
    searchHint: string;
    sort: string;
    newest: string;
    oldest: string;
    alphabetical: string;
    byEmail: string;
    statusFilter: string;
    allStatuses: string;
    presence: string;
    allPresence: string;
    online: string;
    offline: string;
    phone: string;
    nickname: string;
    telegram: string;
    lastSeen: string;
    details: string;
    filterTitle: string;
    filterSubtitle: string;
    clearFilters: string;
    active: string;
    pending: string;
    blocked: string;
    notFound: string;
    siteName: string;
    logoUrl: string;
    siteDescription: string;
    primaryColor: string;
    maintenance: string;
    maintenanceDescription: string;
    save: string;
    dashboardTitle: string;
    welcome: string;
    ordersToday: string;
    revenue: string;
    clients: string;
    products: string;
    inDevelopment: string;
    totalUsers: string;
    activeUsers: string;
    adminCount: string;
    detailedStats: string;
    demoAdminName: string;
    currency: string;
    welcomeCafe: string;
    refresh: string;
    close: string;
    ordersTab: string;
    productsTab: string;
    timezone: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
    manageOrders: string;
    manageProducts: string;
    noOrders: string;
    noProducts: string;
    available: string;
    hidden: string;
    hide: string;
    publish: string;
    category: string;
    payment: string;
    errorLoad: string;
    errorSave: string;
    errorUser: string;
    errorOrder: string;
    errorProduct: string;
    logoUpload: string;
    logoSizeError: string;
  };
  notFound: {
    title: string;
    description: string;
    home: string;
    contact: string;
  };
};

export const uiTranslations: Record<Locale, UiTranslations> = {
  ru: {
    header: {
      kitchen: 'Кухня', admin: 'Админ панель', orders: 'Заказы', lightTheme: 'Светлая тема', darkTheme: 'Темная тема',
      profile: 'Профиль', settings: 'Настройки', logout: 'Выйти', confirmLogout: 'Подтвердить выход', loggingOut: 'Выход...',
      home: 'Главная', login: 'Войти', register: 'Регистрация', language: 'Язык', openMenu: 'Открыть меню', closeMenu: 'Закрыть меню', avatar: 'Аватар',
    },
    profile: {
      roleLabels: { admin: 'Администратор', manager: 'Менеджер', kitchen: 'Кухня', employee: 'Сотрудник', customer: 'Клиент', guest: 'Гость' },
      avatarAlt: 'Аватар профиля', welcome: 'Добро пожаловать! Ваш аккаунт успешно создан.', photo: 'Фото', uploadError: 'Не удалось загрузить аватарку', avatarUpdated: 'Аватарка обновлена', awaitingApproval: 'Ваш аккаунт ожидает подтверждения администратором', loadError: 'Не удалось загрузить профиль',
      profileTab: 'Профиль', settingsTab: 'Настройки', firstName: 'Имя', lastName: 'Фамилия', displayName: 'Отображаемое имя', about: 'О себе', aboutPlaceholder: 'Расскажите о себе...', phone: 'Телефон', timezone: 'Часовой пояс', telegramConnected: 'Telegram подключён', registration: 'Регистрация:', lastLogin: 'Последний вход:', saveProfile: 'Сохранить профиль', saving: 'Сохранение...', notifications: 'Уведомления', emailNotifications: 'Email уведомления', smsNotifications: 'SMS уведомления', pushNotifications: 'Push уведомления', telegramNotifications: 'Telegram уведомления', privacy: 'Приватность', showOnlineStatus: 'Показывать статус онлайн', showPhone: 'Показывать телефон', showEmail: 'Показывать email', compactMode: 'Компактный режим интерфейса', saveSettings: 'Сохранить настройки',
    },
    admin: {
      filterTitle: 'Фильтры пользователей', filterSubtitle: 'Настройте список по роли, статусу и активности', clearFilters: 'Сбросить фильтры',
      title: 'Панель администратора', description: 'Управление пользователями и настройками сайта', users: 'Пользователи', settings: 'Настройки', stats: 'Статистика', search: 'Поиск...', allRoles: 'Все роли', administrators: 'Администраторы', managers: 'Менеджеры', roleKitchen: 'Кухня', employees: 'Сотрудники', customers: 'Клиенты', user: 'Пользователь', email: 'Email', role: 'Роль', status: 'Статус', registered: 'Дата регистрации', actions: 'Действия', searchHint: 'Поиск по имени, email, телефону или нику', sort: 'Сортировка', newest: 'Сначала новые', oldest: 'Сначала старые', alphabetical: 'По алфавиту', byEmail: 'По email', statusFilter: 'Статус аккаунта', allStatuses: 'Все статусы', presence: 'Присутствие', allPresence: 'Все пользователи', online: 'Сейчас в сети', offline: 'Не в сети', phone: 'Телефон', nickname: 'Никнейм', telegram: 'Telegram', lastSeen: 'Последняя активность', details: 'Данные пользователя', active: 'Активен', pending: 'Ожидает', blocked: 'Заблокирован', notFound: 'Пользователи не найдены', siteName: 'Название сайта', logoUrl: 'URL логотипа', siteDescription: 'Описание сайта', primaryColor: 'Основной цвет', maintenance: 'Режим обслуживания', maintenanceDescription: 'Сайт будет недоступен для посетителей', save: 'Сохранить настройки', dashboardTitle: 'Панель управления', welcome: 'Добро пожаловать', welcomeCafe: 'Добро пожаловать в CaféFlow!', ordersToday: 'Заказы сегодня', revenue: 'Выручка', clients: 'Клиенты', products: 'Товары', inDevelopment: 'Панель управления находится в разработке. Скоро здесь появятся все функции управления вашим заведением.', totalUsers: 'Всего пользователей', activeUsers: 'Активных', adminCount: 'Администраторов', detailedStats: 'Детальная статистика в разработке', demoAdminName: 'Администратор', currency: 'сом', refresh: 'Обновить', close: 'Закрыть', ordersTab: 'Заказы', productsTab: 'Товары', timezone: 'Часовой пояс', contactPhone: 'Контактный телефон', contactEmail: 'Контактный email', address: 'Адрес', manageOrders: 'Управление статусами заказов в реальном времени', manageProducts: 'Управление меню и доступностью позиций', noOrders: 'Заказов пока нет', noProducts: 'Товаров пока нет', available: 'Доступен', hidden: 'Скрыт', hide: 'Скрыть', publish: 'Опубликовать', category: 'Без категории', payment: 'Оплата', errorLoad: 'Не удалось загрузить данные', errorSave: 'Не удалось сохранить настройки', errorUser: 'Не удалось обновить пользователя', errorOrder: 'Не удалось обновить заказ', errorProduct: 'Не удалось обновить товар', logoUpload: 'Загрузить логотип', logoSizeError: 'Логотип должен быть изображением до 1 МБ',
    },
    notFound: { title: 'Страница не найдена', description: 'К сожалению, запрашиваемая страница не существует или была перемещена', home: 'На главную', contact: 'Связаться с нами' },
  },
  en: {
    header: {
      kitchen: 'Kitchen', admin: 'Admin panel', orders: 'Orders', lightTheme: 'Light theme', darkTheme: 'Dark theme',
      profile: 'Profile', settings: 'Settings', logout: 'Log out', confirmLogout: 'Confirm log out', loggingOut: 'Logging out...',
      home: 'Home', login: 'Log in', register: 'Sign up', language: 'Language', openMenu: 'Open menu', closeMenu: 'Close menu', avatar: 'Avatar',
    },
    profile: {
      roleLabels: { admin: 'Administrator', manager: 'Manager', kitchen: 'Kitchen', employee: 'Employee', customer: 'Customer', guest: 'Guest' },
      avatarAlt: 'Profile avatar', welcome: 'Welcome! Your account was created successfully.', photo: 'Photo', uploadError: 'Could not upload avatar', avatarUpdated: 'Avatar updated', awaitingApproval: 'Your account is awaiting administrator approval', loadError: 'Could not load profile',
      profileTab: 'Profile', settingsTab: 'Settings', firstName: 'First name', lastName: 'Last name', displayName: 'Display name', about: 'About me', aboutPlaceholder: 'Tell us about yourself...', phone: 'Phone', timezone: 'Time zone', telegramConnected: 'Telegram connected', registration: 'Registered:', lastLogin: 'Last login:', saveProfile: 'Save profile', saving: 'Saving...', notifications: 'Notifications', emailNotifications: 'Email notifications', smsNotifications: 'SMS notifications', pushNotifications: 'Push notifications', telegramNotifications: 'Telegram notifications', privacy: 'Privacy', showOnlineStatus: 'Show online status', showPhone: 'Show phone', showEmail: 'Show email', compactMode: 'Compact interface mode', saveSettings: 'Save settings',
    },
    admin: {
      filterTitle: 'User filters', filterSubtitle: 'Shape the list by role, status and activity', clearFilters: 'Reset filters',
      searchHint: 'Search by name, email, phone or nickname', sort: 'Sort by', newest: 'Newest first', oldest: 'Oldest first', alphabetical: 'Alphabetical', byEmail: 'By email', statusFilter: 'Account status', allStatuses: 'All statuses', presence: 'Presence', allPresence: 'All users', online: 'Online now', offline: 'Offline', phone: 'Phone', nickname: 'Nickname', telegram: 'Telegram', lastSeen: 'Last activity', details: 'User details',
      title: 'Admin panel', description: 'Manage users and site settings', users: 'Users', settings: 'Settings', stats: 'Statistics', search: 'Search...', allRoles: 'All roles', administrators: 'Administrators', managers: 'Managers', roleKitchen: 'Kitchen', employees: 'Employees', customers: 'Customers', user: 'User', email: 'Email', role: 'Role', status: 'Status', registered: 'Registration date', actions: 'Actions', active: 'Active', pending: 'Pending', blocked: 'Blocked', notFound: 'No users found', siteName: 'Site name', logoUrl: 'Logo URL', siteDescription: 'Site description', primaryColor: 'Primary color', maintenance: 'Maintenance mode', maintenanceDescription: 'The site will be unavailable to visitors', save: 'Save settings', dashboardTitle: 'Dashboard', welcome: 'Welcome', welcomeCafe: 'Welcome to CaféFlow!', ordersToday: 'Orders today', revenue: 'Revenue', clients: 'Clients', products: 'Products', inDevelopment: 'The dashboard is under development. Management features will appear here soon.', totalUsers: 'Total users', activeUsers: 'Active', adminCount: 'Administrators', detailedStats: 'Detailed statistics are under development', demoAdminName: 'Administrator', currency: 'KGS', refresh: 'Refresh', close: 'Close', ordersTab: 'Orders', productsTab: 'Products', timezone: 'Time zone', contactPhone: 'Contact phone', contactEmail: 'Contact email', address: 'Address', manageOrders: 'Manage order statuses in real time', manageProducts: 'Manage menu items and availability', noOrders: 'No orders yet', noProducts: 'No products yet', available: 'Available', hidden: 'Hidden', hide: 'Hide', publish: 'Publish', category: 'Uncategorized', payment: 'Payment', errorLoad: 'Could not load data', errorSave: 'Could not save settings', errorUser: 'Could not update user', errorOrder: 'Could not update order', errorProduct: 'Could not update product', logoUpload: 'Upload logo', logoSizeError: 'The logo must be an image up to 1 MB',
    },
    notFound: { title: 'Page not found', description: 'The requested page does not exist or has been moved', home: 'Go home', contact: 'Contact us' },
  },
  kg: {
    header: {
      kitchen: 'Ашкана', admin: 'Админ панели', orders: 'Буйрутмалар', lightTheme: 'Жарык тема', darkTheme: 'Караңгы тема',
      profile: 'Профиль', settings: 'Жөндөөлөр', logout: 'Чыгуу', confirmLogout: 'Чыгууну ырастоо', loggingOut: 'Чыгып жатат...',
      home: 'Башкы бет', login: 'Кирүү', register: 'Катталуу', language: 'Тил', openMenu: 'Менюну ачуу', closeMenu: 'Менюну жабуу', avatar: 'Аватар',
    },
    profile: {
      roleLabels: { admin: 'Администратор', manager: 'Менеджер', kitchen: 'Ашкана', employee: 'Кызматкер', customer: 'Кардар', guest: 'Конок' },
      avatarAlt: 'Профиль аватары', welcome: 'Кош келиңиз! Аккаунтуңуз ийгиликтүү түзүлдү.', photo: 'Сүрөт', uploadError: 'Аватарды жүктөө мүмкүн болгон жок', avatarUpdated: 'Аватар жаңыртылды', awaitingApproval: 'Аккаунтуңуз администратордун ырастоосун күтүп жатат', loadError: 'Профиль жүктөлгөн жок',
      profileTab: 'Профиль', settingsTab: 'Жөндөөлөр', firstName: 'Аты', lastName: 'Фамилиясы', displayName: 'Көрүнүүчү аты', about: 'Өзүңүз жөнүндө', aboutPlaceholder: 'Өзүңүз жөнүндө айтып бериңиз...', phone: 'Телефон', timezone: 'Убакыт алкагы', telegramConnected: 'Telegram туташтырылды', registration: 'Катталган:', lastLogin: 'Акыркы кирүү:', saveProfile: 'Профилди сактоо', saving: 'Сакталууда...', notifications: 'Билдирмелер', emailNotifications: 'Email билдирмелери', smsNotifications: 'SMS билдирмелери', pushNotifications: 'Push билдирмелери', telegramNotifications: 'Telegram билдирмелери', privacy: 'Купуялуулук', showOnlineStatus: 'Онлайн статусун көрсөтүү', showPhone: 'Телефонду көрсөтүү', showEmail: 'Email көрсөтүү', compactMode: 'Ыкчам интерфейс режими', saveSettings: 'Жөндөөлөрдү сактоо',
    },
    admin: {
      filterTitle: 'Колдонуучунун фильтрлери', filterSubtitle: 'Тизмени ролу, статусу жана активдүүлүгү боюнча түзүңүз', clearFilters: 'Фильтрлерди тазалоо',
      searchHint: 'Аты, email, телефон же ник боюнча издөө', sort: 'Иреттөө', newest: 'Жаңылар биринчи', oldest: 'Эскилер биринчи', alphabetical: 'Алфавит боюнча', byEmail: 'Email боюнча', statusFilter: 'Аккаунттун статусу', allStatuses: 'Бардык статустар', presence: 'Онлайн статусу', allPresence: 'Бардык колдонуучулар', online: 'Азыр онлайн', offline: 'Офлайн', phone: 'Телефон', nickname: 'Никнейм', telegram: 'Telegram', lastSeen: 'Акыркы аракет', details: 'Колдонуучунун маалыматтары',
      title: 'Администратор панели', description: 'Колдонуучуларды жана сайт жөндөөлөрүн башкаруу', users: 'Колдонуучулар', settings: 'Жөндөөлөр', stats: 'Статистика', search: 'Издөө...', allRoles: 'Бардык ролдор', administrators: 'Администраторлор', managers: 'Менеджерлер', roleKitchen: 'Ашкана', employees: 'Кызматкерлер', customers: 'Кардарлар', user: 'Колдонуучу', email: 'Email', role: 'Рол', status: 'Статус', registered: 'Катталган күнү', actions: 'Аракеттер', active: 'Активдүү', pending: 'Күтүүдө', blocked: 'Бөгөттөлгөн', notFound: 'Колдонуучулар табылган жок', siteName: 'Сайттын аталышы', logoUrl: 'Логотиптин URL дареги', siteDescription: 'Сайттын сүрөттөмөсү', primaryColor: 'Негизги түс', maintenance: 'Тейлөө режими', maintenanceDescription: 'Сайт коноктор үчүн жеткиликсиз болот', save: 'Жөндөөлөрдү сактоо', dashboardTitle: 'Башкаруу панели', welcome: 'Кош келиңиз', welcomeCafe: 'CaféFlow сайтына кош келиңиз!', ordersToday: 'Бүгүнкү буйрутмалар', revenue: 'Киреше', clients: 'Кардарлар', products: 'Товарлар', inDevelopment: 'Башкаруу панели иштелип жатат. Башкаруу функциялары жакында бул жерде пайда болот.', totalUsers: 'Жалпы колдонуучулар', activeUsers: 'Активдүү', adminCount: 'Администраторлор', detailedStats: 'Толук статистика иштелип жатат', demoAdminName: 'Администратор', currency: 'сом', refresh: 'Жаңыртуу', close: 'Жабуу', ordersTab: 'Буйрутмалар', productsTab: 'Товарлар', timezone: 'Убакыт алкагы', contactPhone: 'Байланыш телефону', contactEmail: 'Байланыш email', address: 'Дарек', manageOrders: 'Буйрутмалардын статусун реалдуу убакытта башкаруу', manageProducts: 'Менюну жана жеткиликтүүлүктү башкаруу', noOrders: 'Буйрутмалар азырынча жок', noProducts: 'Товарлар азырынча жок', available: 'Жеткиликтүү', hidden: 'Жашырылган', hide: 'Жашыруу', publish: 'Жарыялоо', category: 'Категориясыз', payment: 'Төлөм', errorLoad: 'Маалымат жүктөлгөн жок', errorSave: 'Жөндөөлөр сакталган жок', errorUser: 'Колдонуучу жаңыртылган жок', errorOrder: 'Буйрутма жаңыртылган жок', errorProduct: 'Товар жаңыртылган жок', logoUpload: 'Логотип жүктөө', logoSizeError: 'Логотип 1 МБдан чоң эмес сүрөт болушу керек',
    },
    notFound: { title: 'Бет табылган жок', description: 'Суралган бет жок же башка жакка жылдырылган', home: 'Башкы бетке', contact: 'Байланышуу' },
  },
};

export function getUiTranslations(locale: Locale): UiTranslations {
  return uiTranslations[locale] || uiTranslations.ru;
}
