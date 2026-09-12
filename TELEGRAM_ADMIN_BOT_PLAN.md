# 🤖 План реализации Telegram бота для админов

**Версия:** 2.0  
**Дата:** 12.09.2026  
**Цель:** Полноценный административный бот с уведомлениями и управлением

---

## 📋 СОДЕРЖАНИЕ

1. [Концепция и возможности](#концепция)
2. [Архитектура](#архитектура)
3. [Этапы реализации](#этапы)
4. [Детальная спецификация](#спецификация)
5. [Безопасность](#безопасность)
6. [UI/UX бота](#ui-ux)
7. [Техническая реализация](#техническая-реализация)

---

## 🎯 КОНЦЕПЦИЯ

### Основная идея:
**Telegram бот как мобильная админ-панель** - сотрудники могут:
- Получать уведомления о событиях в реальном времени
- Управлять заказами через бот
- Просматривать статистику
- Входить в веб-админку через бота (passwordless login)

### Целевая аудитория:
- 👑 Администраторы - полный контроль
- 👔 Менеджеры - заказы, бронирования, статистика
- 👨‍🍳 Кухня - только заказы
- 👤 Официанты - столики и заказы

---

## 🏗️ АРХИТЕКТУРА

### Компоненты системы:

```
┌─────────────────────────────────────────────────────────┐
│                    TELEGRAM BOT                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Commands  │  │  Callbacks  │  │  Sessions   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                  BOT MIDDLEWARE                         │
│  • Auth Check  • Role Check  • Rate Limit              │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                   BOT SERVICES                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Orders  │ │  Stats   │ │  Booking │ │  Auth    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              NEXT.JS API + DATABASE                     │
└─────────────────────────────────────────────────────────┘
```

### Основные паттерны:
1. **Scene-based navigation** - многоступенчатые диалоги
2. **Inline keyboards** - быстрые действия
3. **Callback queries** - интерактивные кнопки
4. **Conversations** - сбор данных от пользователя
5. **Magic link** - вход в админку без пароля

---

## 🎯 ЭТАПЫ РЕАЛИЗАЦИИ

### **Этап 1: Улучшенная аутентификация (1-2 дня)**

#### Что добавляем:
1. **Magic Link Login** - вход в админку через Telegram
2. **QR-код вход** - сканирование из веб-админки
3. **One-Tap Login** - быстрая авторизация

#### Как работает Magic Link:
```
1. Пользователь открывает веб-админку
2. Нажимает "Войти через Telegram"
3. Генерируется уникальная ссылка
4. Пользователь переходит по ссылке → открывается бот
5. Бот подтверждает вход
6. Веб-админка автоматически авторизует
```

---

### **Этап 2: Уведомления (1 день)**

#### Типы уведомлений:

**🔔 Критичные (всегда):**
- Новый заказ
- Отмена заказа
- Проблема на кухне
- Неудачная оплата

**📢 Важные (настраиваемые):**
- Новое бронирование
- Отмена бронирования
- Заказ готов к выдаче
- Заказ доставлен

**ℹ️ Информационные (опционально):**
- Ежедневная статистика
- Популярные блюда
- Низкий остаток товара

#### Реализация:
```typescript
// Подписка на уведомления
await bot.sendMessage(chatId, 'Выберите уведомления:', {
  reply_markup: {
    inline_keyboard: [
      [{ text: '🔔 Новые заказы', callback_data: 'notif_orders' }],
      [{ text: '📅 Бронирования', callback_data: 'notif_bookings' }],
      [{ text: '💰 Статистика', callback_data: 'notif_stats' }],
    ]
  }
});
```

---

### **Этап 3: Управление заказами (2-3 дня)**

#### Команды:
- `/orders` - список активных заказов
- `/order_123` - детали заказа #123
- `/today` - сегодняшние заказы
- `/stats` - быстрая статистика

#### Интерактивные действия:
```
┌────────────────────────────────────┐
│  📦 Заказ #1234                    │
│  ─────────────────────────────     │
│  👤 Иван Петров                    │
│  📱 +996 555 123 456               │
│  💰 1,250 сом                      │
│  🕐 15:30 (5 минут назад)          │
│  ─────────────────────────────     │
│  🍕 Пицца Маргарита x2             │
│  🥤 Coca-Cola 0.5л x1              │
│  ─────────────────────────────     │
│  [ ✅ Подтвердить ]  [ ❌ Отменить ]│
│  [ 🍳 На кухню ]     [ 📋 Детали ] │
└────────────────────────────────────┘
```

#### Быстрые фильтры:
- Новые заказы
- В приготовлении
- Готовы к выдаче
- На доставке
- Проблемные

---

### **Этап 4: Статистика и аналитика (1-2 дня)**

#### Команды:
- `/stats` - общая статистика
- `/today` - сегодня
- `/week` - за неделю
- `/top` - топ блюд

#### Пример вывода:
```
📊 Статистика за сегодня

💰 Выручка: 45,230 сом (+12%)
📦 Заказов: 67 (+5)
👥 Клиентов: 52 (новых: 8)
⭐ Средний чек: 675 сом

🔥 Топ блюд:
1. Пицца Маргарита (18 шт)
2. Бургер Классик (15 шт)
3. Салат Цезарь (12 шт)

📈 График продаж:
▓▓▓▓▓▓▓░░░░░ 60%
[Подробнее в админке →]
```

---

### **Этап 5: Бронирования (1-2 дня)**

#### Функции:
- Список активных бронирований
- Подтверждение/отмена
- Просмотр свободных столиков
- Создание бронирования через бота

#### Команды:
- `/bookings` - активные бронирования
- `/tables` - карта столиков
- `/book` - создать бронирование

---

### **Этап 6: Настройки и профиль (1 день)**

#### Команды:
- `/settings` - настройки уведомлений
- `/profile` - мой профиль
- `/help` - справка

#### Настройки:
```
⚙️ Настройки

🔔 Уведомления:
  ✅ Новые заказы
  ✅ Бронирования
  ❌ Ежедневная статистика
  
🕐 Рабочее время:
  С 09:00 до 22:00
  
📍 Филиал:
  Основной (Бишкек)
  
💬 Язык:
  Русский
```

---

## 📝 ДЕТАЛЬНАЯ СПЕЦИФИКАЦИЯ

### **1. Структура команд**

#### Основные команды:
```typescript
/start          - Приветствие и привязка аккаунта
/menu           - Главное меню бота
/orders         - Управление заказами
/stats          - Статистика
/bookings       - Бронирования
/settings       - Настройки
/help           - Справка
/logout         - Отвязать аккаунт
```

#### Роль-специфичные команды:

**Администратор:**
```typescript
/users          - Список пользователей
/reports        - Отчёты
/config         - Конфигурация системы
```

**Менеджер:**
```typescript
/staff          - Сотрудники на смене
/inventory      - Остатки товаров
```

**Кухня:**
```typescript
/kitchen        - Заказы для кухни
/ready <id>     - Отметить готовым
```

---

### **2. Inline клавиатуры**

#### Главное меню:
```typescript
const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📦 Заказы', callback_data: 'orders' },
        { text: '📊 Статистика', callback_data: 'stats' }
      ],
      [
        { text: '📅 Бронирования', callback_data: 'bookings' },
        { text: '⚙️ Настройки', callback_data: 'settings' }
      ],
      [
        { text: '🌐 Открыть админку', url: 'https://admin.cafeflow.com' }
      ]
    ]
  }
};
```

#### Управление заказом:
```typescript
const orderActions = (orderId: string) => ({
  inline_keyboard: [
    [
      { text: '✅ Подтвердить', callback_data: `order_confirm_${orderId}` },
      { text: '❌ Отменить', callback_data: `order_cancel_${orderId}` }
    ],
    [
      { text: '🍳 На кухню', callback_data: `order_kitchen_${orderId}` },
      { text: '✔️ Готово', callback_data: `order_ready_${orderId}` }
    ],
    [
      { text: '📋 Детали', callback_data: `order_details_${orderId}` },
      { text: '🔙 Назад', callback_data: 'orders_list' }
    ]
  ]
});
```

---

### **3. Сценарии (Scenes)**

#### Scene 1: Вход через Magic Link
```
User → Открывает веб-админку
Web  → Генерирует magic_token
Web  → Показывает кнопку "Войти через Telegram"
User → Нажимает кнопку
Web  → Открывает t.me/bot?start=magic_{token}
Bot  → Проверяет токен
Bot  → Отправляет подтверждение
User → Подтверждает вход
Bot  → Создаёт сессию
Web  → Автоматически входит (WebSocket/Polling)
```

#### Scene 2: Обработка нового заказа
```
System → Создаётся заказ в БД
System → Webhook уведомляет бота
Bot    → Находит админов с подпиской на "Новые заказы"
Bot    → Отправляет уведомление с кнопками
Admin  → Нажимает "Подтвердить"
Bot    → Обновляет статус в БД
Bot    → Уведомляет кухню
Bot    → Уведомляет клиента
```

---

## 🔐 БЕЗОПАСНОСТЬ

### 1. **Аутентификация бота**

```typescript
// Middleware для проверки пользователя
bot.use(async (ctx, next) => {
  const chatId = ctx.chat?.id.toString();
  
  // Проверка привязки аккаунта
  const user = await prisma.users.findFirst({
    where: { telegram_chat_id: chatId }
  });
  
  if (!user) {
    await ctx.reply('❌ Аккаунт не привязан. Используйте /start');
    return;
  }
  
  // Проверка статуса пользователя
  if (user.status !== 'active') {
    await ctx.reply('❌ Ваш аккаунт заблокирован');
    return;
  }
  
  // Добавляем пользователя в контекст
  ctx.user = user;
  await next();
});
```

### 2. **Проверка ролей**

```typescript
// Middleware для проверки роли
const requireRole = (...roles: user_role[]) => {
  return async (ctx: BotContext, next: () => Promise<void>) => {
    if (!ctx.user || !roles.includes(ctx.user.role)) {
      await ctx.reply('❌ Недостаточно прав');
      return;
    }
    await next();
  };
};

// Использование
bot.command('users', requireRole('admin', 'manager'), async (ctx) => {
  // Только для admin и manager
});
```

### 3. **Magic Link Security**

```typescript
interface MagicLinkToken {
  token: string;        // Случайный UUID
  userId: string;       // ID пользователя
  expiresAt: Date;      // 5 минут
  used: boolean;        // Одноразовый
  ipAddress?: string;   // IP для проверки
  userAgent?: string;   // User Agent
}

// Создание magic link
async function createMagicLink(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  
  await prisma.magic_link_tokens.create({
    data: {
      token,
      user_id: userId,
      expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 минут
      used: false,
    }
  });
  
  return `https://t.me/cafeflow_manager_bot?start=magic_${token}`;
}
```

### 4. **Rate Limiting**

```typescript
// Ограничение количества команд
const rateLimiter = new Map<string, number[]>();

bot.use(async (ctx, next) => {
  const chatId = ctx.chat?.id.toString();
  if (!chatId) return;
  
  const now = Date.now();
  const timestamps = rateLimiter.get(chatId) || [];
  
  // Удаляем старые запросы (старше 1 минуты)
  const recent = timestamps.filter(t => now - t < 60000);
  
  // Максимум 20 запросов в минуту
  if (recent.length >= 20) {
    await ctx.reply('⚠️ Слишком много запросов. Подождите минуту.');
    return;
  }
  
  recent.push(now);
  rateLimiter.set(chatId, recent);
  
  await next();
});
```

---

## 🎨 UI/UX ДИЗАЙН БОТА

### Принципы:
1. **Минимум текста** - максимум кнопок
2. **Эмодзи** - для быстрого визуального распознавания
3. **Быстрые действия** - не больше 2 тапов
4. **Контекст** - помнить предыдущие действия
5. **Обратная связь** - подтверждение каждого действия

### Примеры сообщений:

#### ✅ Хорошо:
```
📦 Новый заказ #1234

👤 Иван Петров
📱 +996 555 123 456
💰 1,250 сом

[ ✅ Подтвердить ]  [ ❌ Отменить ]
```

#### ❌ Плохо:
```
Получен новый заказ с номером 1234 от клиента Иван Петров, телефон +996 555 123 456. Сумма заказа составляет 1250 сом. Пожалуйста, подтвердите или отмените заказ.

Для подтверждения используйте команду /confirm_1234
Для отмены используйте команду /cancel_1234
```

---

## 💻 ТЕХНИЧЕСКАЯ РЕАЛИЗАЦИЯ

### **Структура файлов:**

```
src/lib/telegram/
├── bot.ts                    # Основной бот
├── middleware/
│   ├── auth.ts              # Аутентификация
│   ├── role.ts              # Проверка ролей
│   └── rateLimit.ts         # Rate limiting
├── handlers/
│   ├── commands.ts          # Команды
│   ├── callbacks.ts         # Callback queries
│   └── scenes.ts            # Сценарии
├── services/
│   ├── orders.ts            # Сервис заказов
│   ├── stats.ts             # Статистика
│   ├── bookings.ts          # Бронирования
│   ├── notifications.ts     # Уведомления
│   └── magicLink.ts         # Magic link
├── keyboards/
│   ├── main.ts              # Главное меню
│   ├── orders.ts            # Клавиатуры заказов
│   └── settings.ts          # Настройки
└── utils/
    ├── formatters.ts        # Форматирование сообщений
    └── validators.ts        # Валидация данных
```

### **Пример реализации команды:**

```typescript
// src/lib/telegram/handlers/orders.ts

import { BotContext } from '../bot';
import { prisma } from '@/lib/prisma';
import { formatOrder, orderKeyboard } from '../keyboards/orders';

export async function handleOrdersCommand(ctx: BotContext) {
  const user = ctx.user!;
  
  // Получаем активные заказы
  const orders = await prisma.orders.findMany({
    where: {
      tenant_id: user.tenant_id,
      status: {
        in: ['new', 'confirmed', 'cooking', 'ready']
      }
    },
    include: {
      order_items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 10
  });
  
  if (orders.length === 0) {
    await ctx.reply('📭 Нет активных заказов');
    return;
  }
  
  // Отправляем список заказов
  await ctx.reply(`📦 Активные заказы (${orders.length}):`, {
    reply_markup: ordersListKeyboard(orders)
  });
}

export async function handleOrderDetails(ctx: BotContext, orderId: string) {
  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    include: {
      order_items: {
        include: { product: true }
      },
      user: true
    }
  });
  
  if (!order) {
    await ctx.answerCallbackQuery('Заказ не найден');
    return;
  }
  
  const message = formatOrder(order);
  
  await ctx.editMessageText(message, {
    reply_markup: orderKeyboard(orderId),
    parse_mode: 'HTML'
  });
  
  await ctx.answerCallbackQuery();
}
```

### **Magic Link реализация:**

```typescript
// src/lib/telegram/services/magicLink.ts

export async function createMagicLink(userId: string): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, '');
  
  await prisma.magic_link_tokens.create({
    data: {
      token,
      user_id: userId,
      expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 минут
      used: false
    }
  });
  
  return `https://t.me/cafeflow_manager_bot?start=magic_${token}`;
}

export async function verifyMagicLink(token: string): Promise<string | null> {
  const linkToken = await prisma.magic_link_tokens.findUnique({
    where: { token }
  });
  
  if (!linkToken) return null;
  
  // Проверки
  if (linkToken.used) return null;
  if (linkToken.expires_at < new Date()) return null;
  
  // Отмечаем как использованный
  await prisma.magic_link_tokens.update({
    where: { token },
    data: { used: true }
  });
  
  return linkToken.user_id;
}

// Обработчик в боте
bot.command('start', async (ctx) => {
  const args = ctx.message?.text.split(' ');
  
  if (args && args[1]?.startsWith('magic_')) {
    const token = args[1].replace('magic_', '');
    const userId = await verifyMagicLink(token);
    
    if (!userId) {
      await ctx.reply('❌ Ссылка недействительна или истекла');
      return;
    }
    
    // Создаём сессию
    const session = await createAdminSession(userId);
    
    await ctx.reply(
      '✅ Вход выполнен успешно!\n\n' +
      'Окно браузера должно автоматически обновиться.\n' +
      'Если этого не произошло, обновите страницу вручную.'
    );
    
    return;
  }
  
  // Обычное приветствие
  await ctx.reply('👋 Добро пожаловать!');
});
```

### **WebSocket для автоматического входа:**

```typescript
// src/app/api/auth/magic-link/poll/route.ts

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }
  
  // Проверяем создана ли сессия для этого magic link
  const session = await prisma.auth_sessions.findFirst({
    where: {
      magic_link_token: token,
      created_at: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // 5 минут
      }
    }
  });
  
  if (session) {
    return NextResponse.json({
      success: true,
      accessToken: session.token
    });
  }
  
  return NextResponse.json({
    success: false,
    message: 'Waiting for confirmation'
  });
}
```

---

## 📊 БАЗА ДАННЫХ

### Новые таблицы:

```prisma
// prisma/schema.prisma

// Magic link tokens для входа через Telegram
model magic_link_tokens {
  id         String   @id @default(uuid()) @db.Uuid
  token      String   @unique @db.VarChar(100)
  user_id    String   @db.Uuid
  expires_at DateTime @db.Timestamptz
  used       Boolean  @default(false)
  ip_address String?  @db.Inet
  user_agent String?  @db.VarChar(500)
  created_at DateTime @default(now()) @db.Timestamptz

  user users @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([user_id])
  @@index([expires_at])
}

// Настройки уведомлений для пользователей
model notification_settings {
  id                     String  @id @default(uuid()) @db.Uuid
  user_id                String  @unique @db.Uuid
  notify_new_orders      Boolean @default(true)
  notify_order_status    Boolean @default(true)
  notify_bookings        Boolean @default(true)
  notify_daily_stats     Boolean @default(false)
  notify_low_stock       Boolean @default(false)
  work_hours_start       String? @db.Time // "09:00"
  work_hours_end         String? @db.Time // "22:00"
  created_at             DateTime @default(now()) @db.Timestamptz
  updated_at             DateTime @updatedAt @db.Timestamptz

  user users @relation(fields: [user_id], references: [id], onDelete: Cascade)
}

// История взаимодействий с ботом
model bot_interactions {
  id         String   @id @default(uuid()) @db.Uuid
  user_id    String   @db.Uuid
  command    String   @db.VarChar(100)
  payload    Json?
  created_at DateTime @default(now()) @db.Timestamptz

  user users @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([created_at])
}
```

---

## 🚀 ПЛАН ВНЕДРЕНИЯ

### **Неделя 1: Улучшенная аутентификация**
- [ ] Magic Link токены в БД
- [ ] Генерация magic link в админке
- [ ] Обработчик magic link в боте
- [ ] Polling endpoint для автоматического входа
- [ ] QR-код вход

### **Неделя 2: Уведомления**
- [ ] Настройки уведомлений в БД
- [ ] Команда /settings
- [ ] Отправка уведомлений о заказах
- [ ] Отправка уведомлений о бронированиях
- [ ] Фоновый процесс для статистики

### **Неделя 3: Управление заказами**
- [ ] Команда /orders
- [ ] Inline клавиатуры для заказов
- [ ] Действия над заказами (подтвердить, отменить)
- [ ] Фильтры и поиск
- [ ] Детали заказа

### **Неделя 4: Статистика и бронирования**
- [ ] Команда /stats
- [ ] Команда /today
- [ ] Команда /bookings
- [ ] Управление бронированиями
- [ ] Топ блюд

---

## ✅ ЧЕКЛИСТ ГОТОВНОСТИ

### Перед запуском:
- [ ] Все команды протестированы
- [ ] Inline клавиатуры работают
- [ ] Magic link работает
- [ ] Уведомления отправляются
- [ ] Rate limiting настроен
- [ ] Логирование работает
- [ ] Обработка ошибок добавлена
- [ ] Документация обновлена

---

## 📝 ЗАКЛЮЧЕНИЕ

Этот план превращает ваш Telegram бот из простого 2FA инструмента в **полноценную мобильную админ-панель**.

### Преимущества:
✅ Мгновенные уведомления  
✅ Быстрое управление заказами  
✅ Вход без пароля  
✅ Работает на любом устройстве  
✅ Не нужно устанавливать приложение  

### Следующие шаги:
1. Начните с **Magic Link** - это самая полезная фича
2. Добавьте **уведомления о заказах** - критично для бизнеса
3. Затем **управление заказами**
4. Остальное по необходимости

**Готовы начать реализацию?** 🚀

