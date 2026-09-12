# 🔐 Комплексная система авторизации и ролей CafeFlow

**Версия:** 3.0 - Полная система с ролями, профилями и защищённым ботом  
**Дата:** 12.09.2026

---

## 📋 СОДЕРЖАНИЕ

1. [Концепция системы](#концепция)
2. [Роли и права доступа](#роли)
3. [Защита Telegram бота](#защита-бота)
4. [Архитектура авторизации](#архитектура)
5. [База данных](#база-данных)
6. [Backend реализация](#backend)
7. [Frontend компоненты](#frontend)
8. [Telegram Bot](#telegram-bot)
9. [План внедрения](#план)

---

## 🎯 КОНЦЕПЦИЯ СИСТЕМЫ

### Основные принципы:

1. **Единая точка входа** - один `/login` для всех пользователей
2. **Роль-ориентированная навигация** - каждая роль видит свой интерфейс
3. **Динамические права** - гибкая настройка прав для каждой роли
4. **Защищённый Telegram бот** - доступ только по секретному ключу
5. **Профили пользователей** - аватар, настройки, история

---

## 👥 РОЛИ И ПРАВА ДОСТУПА

### Иерархия ролей:

```
┌─────────────────────────────────────────┐
│           ADMIN (Администратор)         │
│  • Полный доступ ко всему               │
│  • Управление пользователями            │
│  • Управление ролями                    │
│  • Доступ к Telegram боту               │
│  • Настройки системы                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│          MANAGER (Менеджер)             │
│  • Управление заказами                  │
│  • Управление меню                      │
│  • Просмотр статистики                  │
│  • Управление бронированиями            │
│  • Доступ к Telegram боту (опционально) │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│          KITCHEN (Кухня)                │
│  • Просмотр заказов для кухни           │
│  • Обновление статусов приготовления    │
│  • Отметка проблем                      │
│  • Доступ к Telegram боту (уведомления) │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         EMPLOYEE (Сотрудник)            │
│  • Просмотр заказов                     │
│  • Управление бронированиями            │
│  • Обслуживание столиков                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         CUSTOMER (Клиент)               │
│  • Просмотр меню                        │
│  • Оформление заказов                   │
│  • Бронирование столиков                │
│  • Личный кабинет                       │
│  • История заказов                      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│          GUEST (Гость)                  │
│  • Просмотр меню                        │
│  • Информация о заведении               │
│  • Регистрация                          │
└─────────────────────────────────────────┘
```

### Матрица прав доступа:

| Возможность | Admin | Manager | Kitchen | Employee | Customer | Guest |
|------------|:-----:|:-------:|:-------:|:--------:|:--------:|:-----:|
| **Общее** |
| Просмотр меню | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Регистрация | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Личный кабинет | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Заказы** |
| Оформление заказа | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Просмотр всех заказов | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Управление заказами | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Отмена заказа | ✅ | ✅ | ❌ | ❌ | своих | ❌ |
| **Меню** |
| Редактирование меню | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Управление категориями | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Доступность блюд | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Бронирования** |
| Создание брони | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Управление бронями | ✅ | ✅ | ❌ | ✅ | своих | ❌ |
| Просмотр всех броней | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Кухня** |
| Просмотр заказов кухни | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Обновление статусов | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Пользователи** |
| Просмотр пользователей | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Создание пользователей | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Управление ролями | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Блокировка пользователей | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Аналитика** |
| Просмотр статистики | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Экспорт отчётов | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Настройки** |
| Настройки системы | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Настройки заведения | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Telegram Bot** |
| Доступ к боту | ✅ | опц. | опц. | ❌ | ❌ | ❌ |
| Управление через бота | ✅ | опц. | ❌ | ❌ | ❌ | ❌ |

---

## 🤖 ЗАЩИТА TELEGRAM БОТА

### Концепция:

**Бот защищён секретным ключом доступа** - только те, кому вы дали ключ, могут использовать бота.

### Как это работает:

```
1. Пользователь открывает бота → нажимает START

2. Бот: "🔒 Введите ключ доступа для активации бота"

3. Пользователь вводит: CAFEFLOW-ADMIN-2026-SECRET

4. Бот проверяет ключ:
   ✅ Правильный → "Теперь привяжите свой аккаунт"
   ❌ Неправильный → "Неверный ключ. Доступ запрещён."

5. После активации ключа → привязка аккаунта по email

6. Бот проверяет роль пользователя:
   ✅ Admin/Manager → полный доступ
   ✅ Kitchen → только заказы
   ❌ Customer/Guest → доступ запрещён
```

### Генерация ключей:

```typescript
// Типы ключей доступа
enum BotAccessKeyType {
  MASTER = 'master',      // Полный доступ (для админов)
  MANAGER = 'manager',    // Для менеджеров
  KITCHEN = 'kitchen',    // Для кухни
  STAFF = 'staff'         // Для персонала
}

// Пример ключей:
MASTER:  "CAFEFLOW-ADMIN-7K3P9X2M"
MANAGER: "CAFEFLOW-MGR-B4N8Q1RT"
KITCHEN: "CAFEFLOW-KITCH-W6D2F5HL"
```

### База данных для ключей:

```prisma
model bot_access_keys {
  id                String          @id @default(uuid()) @db.Uuid
  key               String          @unique @db.VarChar(50)
  key_type          String          @db.VarChar(20) // master, manager, kitchen
  description       String?         @db.VarChar(255)
  
  // Ограничения
  max_uses          Int?            // null = безлимит
  uses_count        Int             @default(0)
  expires_at        DateTime?       @db.Timestamptz
  
  // Статус
  is_active         Boolean         @default(true)
  
  // Создатель
  created_by        String          @db.Uuid
  
  // Timestamps
  created_at        DateTime        @default(now()) @db.Timestamptz
  updated_at        DateTime        @updatedAt @db.Timestamptz

  creator           users           @relation(fields: [created_by], references: [id])
  activations       bot_key_activations[]

  @@index([key])
  @@index([key_type])
  @@index([is_active])
}

// История активаций ключей
model bot_key_activations {
  id                String          @id @default(uuid()) @db.Uuid
  key_id            String          @db.Uuid
  user_id           String          @db.Uuid
  telegram_chat_id  String          @db.VarChar(100)
  activated_at      DateTime        @default(now()) @db.Timestamptz

  key               bot_access_keys @relation(fields: [key_id], references: [id])
  user              users           @relation(fields: [user_id], references: [id])

  @@index([key_id])
  @@index([user_id])
}
```

---

## 🏗️ АРХИТЕКТУРА АВТОРИЗАЦИИ

### Общая схема:

```
┌─────────────────────────────────────────────────────┐
│                  ЕДИНЫЙ ВХОД                        │
│              /login (для всех)                      │
└────────────────────┬────────────────────────────────┘
                     ↓
        ┌────────────────────────┐
        │  Проверка email+пароль │
        └────────────┬───────────┘
                     ↓
        ┌────────────────────────┐
        │  Проверка роли         │
        └────────────┬───────────┘
                     ↓
        ┌─────────────────────────────────┐
        │  Перенаправление по роли:       │
        │                                 │
        │  Admin → /admin/dashboard       │
        │  Manager → /admin/orders        │
        │  Kitchen → /admin/kitchen       │
        │  Employee → /admin/tables       │
        │  Customer → /profile            │
        │  Guest → / (главная)            │
        └─────────────────────────────────┘
```

### Middleware защита маршрутов:

```typescript
// src/middleware.ts

const roleBasedRoutes = {
  '/admin': ['admin'],
  '/admin/users': ['admin'],
  '/admin/settings': ['admin'],
  '/admin/orders': ['admin', 'manager'],
  '/admin/menu': ['admin', 'manager'],
  '/admin/kitchen': ['admin', 'manager', 'kitchen'],
  '/admin/tables': ['admin', 'manager', 'employee'],
  '/admin/stats': ['admin', 'manager'],
  '/profile': ['admin', 'manager', 'kitchen', 'employee', 'customer'],
};

function checkRouteAccess(pathname: string, userRole: string): boolean {
  for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(route)) {
      return allowedRoles.includes(userRole);
    }
  }
  return false;
}
```

---

## 📊 БАЗА ДАННЫХ

### Обновлённая схема users:

```prisma
model users {
  id                String      @id @default(uuid()) @db.Uuid
  tenant_id         String?     @db.Uuid
  branch_id         String?     @db.Uuid
  
  // Авторизация
  email             String      @unique @db.VarChar(255)
  phone             String?     @db.VarChar(40)
  password_hash     String
  
  // Профиль
  first_name        String      @db.VarChar(100)
  last_name         String?     @db.VarChar(100)
  display_name      String?     @db.VarChar(150)
  avatar_file_id    String?     @db.Uuid
  bio               String?     @db.Text
  
  // Роль и статус
  role              user_role   @default(customer)
  status            user_status @default(active)
  
  // Верификация
  email_verified_at DateTime?   @db.Timestamptz
  phone_verified_at DateTime?   @db.Timestamptz
  
  // Telegram
  telegram_chat_id  String?     @unique @db.VarChar(100)
  telegram_username String?     @db.VarChar(100)
  telegram_activated_with_key String? @db.VarChar(50)
  
  // 2FA
  two_fa_enabled    Boolean     @default(false)
  two_fa_secret     String?     @db.VarChar(255)
  
  // Настройки
  requires_approval Boolean     @default(false) // Только для staff
  language          String      @default("ru") @db.VarChar(5)
  timezone          String      @default("Asia/Bishkek") @db.VarChar(50)
  
  // Активность
  last_login_at     DateTime?   @db.Timestamptz
  last_seen_at      DateTime?   @db.Timestamptz
  
  // Timestamps
  created_at        DateTime    @default(now()) @db.Timestamptz
  updated_at        DateTime    @updatedAt @db.Timestamptz

  // Связи
  tenant            tenants?    @relation(fields: [tenant_id], references: [id])
  branch            branches?   @relation(fields: [branch_id], references: [id])
  avatar_file       files?      @relation("user_avatar_file", fields: [avatar_file_id], references: [id])

  // Обратные связи
  orders            orders[]
  reservations      reservations[]
  reviews           reviews[]
  favorites         favorites[]
  access_requests   access_requests[] @relation("access_requests")
  approved_requests access_requests[] @relation("approved_requests")
  bot_access_keys   bot_access_keys[]
  bot_activations   bot_key_activations[]
  
  @@index([email])
  @@index([role])
  @@index([status])
  @@index([telegram_chat_id])
}

// Обновляем enum ролей
enum user_role {
  guest      // Гость (неавторизованный)
  customer   // Клиент
  employee   // Сотрудник
  kitchen    // Кухня
  manager    // Менеджер
  admin      // Администратор
}
```

### Таблица настроек пользователя:

```prisma
model user_settings {
  id                    String   @id @default(uuid()) @db.Uuid
  user_id               String   @unique @db.Uuid
  
  // Уведомления
  email_notifications   Boolean  @default(true)
  sms_notifications     Boolean  @default(false)
  push_notifications    Boolean  @default(true)
  telegram_notifications Boolean @default(true)
  
  // Приватность
  show_online_status    Boolean  @default(true)
  show_phone            Boolean  @default(false)
  show_email            Boolean  @default(false)
  
  // Интерфейс
  theme                 String   @default("light") @db.VarChar(20)
  compact_mode          Boolean  @default(false)
  
  // Timestamps
  created_at            DateTime @default(now()) @db.Timestamptz
  updated_at            DateTime @updatedAt @db.Timestamptz

  user                  users    @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

---

## 💻 BACKEND РЕАЛИЗАЦИЯ

### 1. Единый endpoint входа

```typescript
// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Находим пользователя
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        tenant: true,
        branch: true
      }
    });

    if (!user) {
      await logFailedAttempt(email, request, 'User not found');
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Проверяем статус
    if (user.status === 'blocked') {
      return NextResponse.json(
        { error: 'Аккаунт заблокирован. Обратитесь к администратору.' },
        { status: 403 }
      );
    }

    if (user.status === 'pending') {
      return NextResponse.json(
        { error: 'Аккаунт ожидает активации.' },
        { status: 403 }
      );
    }

    // Проверяем пароль
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      await logFailedAttempt(email, request, 'Invalid password');
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Проверяем требуется ли подтверждение администратора
    if (user.requires_approval && user.role !== 'admin') {
      return await handleApprovalRequired(user, request);
    }

    // Генерируем токены
    const { accessToken, refreshToken } = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id || undefined
    });

    // Обновляем последний вход
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    // Логируем успешный вход
    await prisma.login_attempts.create({
      data: {
        email,
        ip_address: request.ip || '0.0.0.0',
        user_agent: request.headers.get('user-agent'),
        success: true
      }
    });

    logger.info('User logged in', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Определяем redirect URL по роли
    const redirectUrl = getRedirectByRole(user.role);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        avatar: user.avatar_file_id
      },
      accessToken,
      refreshToken,
      redirectUrl
    });

  } catch (error) {
    logger.error('Login error', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Определение redirect URL по роли
function getRedirectByRole(role: string): string {
  const redirects: Record<string, string> = {
    admin: '/admin/dashboard',
    manager: '/admin/orders',
    kitchen: '/admin/kitchen',
    employee: '/admin/tables',
    customer: '/profile',
    guest: '/'
  };
  
  return redirects[role] || '/';
}

async function logFailedAttempt(
  email: string,
  request: NextRequest,
  reason: string
) {
  await prisma.login_attempts.create({
    data: {
      email,
      ip_address: request.ip || '0.0.0.0',
      user_agent: request.headers.get('user-agent'),
      success: false,
      reason
    }
  });
}
```

### 2. API для регистрации

```typescript
// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone, role } = await request.json();

    // Валидация
    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: 'Заполните обязательные поля' },
        { status: 400 }
      );
    }

    // Проверка силы пароля
    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: 'Пароль слишком простой', details: passwordErrors },
        { status: 400 }
      );
    }

    // Проверка существующего email
    const existing = await prisma.users.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    // Хешируем пароль
    const passwordHash = await hashPassword(password);

    // Определяем роль (по умолчанию customer)
    const userRole = role && ['customer', 'employee'].includes(role) 
      ? role 
      : 'customer';

    // Создаём пользователя
    const user = await prisma.users.create({
      data: {
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: userRole,
        status: 'active',
        display_name: `${firstName} ${lastName || ''}`.trim()
      }
    });

    logger.info('User registered', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return NextResponse.json({
      success: true,
      message: 'Регистрация успешна! Войдите в систему.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        role: user.role
      }
    });

  } catch (error) {
    logger.error('Registration error', error);
    return NextResponse.json(
      { error: 'Ошибка регистрации' },
      { status: 500 }
    );
  }
}
```

### 3. API профиля пользователя

```typescript
// src/app/api/user/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/password';

// GET - получить профиль
export async function GET(request: NextRequest) {
  const token = extractTokenFromHeader(request);
  const payload = await verifyAccessToken(token);

  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.users.findUnique({
    where: { id: payload.userId },
    include: {
      avatar_file: true,
      tenant: true,
      branch: true
    }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    displayName: user.display_name,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar_file?.storage_key,
    bio: user.bio,
    emailVerified: !!user.email_verified_at,
    phoneVerified: !!user.phone_verified_at,
    telegramLinked: !!user.telegram_chat_id,
    twoFaEnabled: user.two_fa_enabled,
    createdAt: user.created_at
  });
}

// PATCH - обновить профиль
export async function PATCH(request: NextRequest) {
  const token = extractTokenFromHeader(request);
  const payload = await verifyAccessToken(token);

  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const updates: any = {};

  // Разрешённые поля для обновления
  if (data.firstName) updates.first_name = data.firstName;
  if (data.lastName) updates.last_name = data.lastName;
  if (data.phone) updates.phone = data.phone;
  if (data.bio) updates.bio = data.bio;
  if (data.language) updates.language = data.language;
  if (data.timezone) updates.timezone = data.timezone;

  // Обновляем display_name
  if (data.firstName || data.lastName) {
    const user = await prisma.users.findUnique({
      where: { id: payload.userId }
    });
    updates.display_name = `${data.firstName || user?.first_name} ${data.lastName || user?.last_name || ''}`.trim();
  }

  const updated = await prisma.users.update({
    where: { id: payload.userId },
    data: updates
  });

  return NextResponse.json({
    success: true,
    user: {
      firstName: updated.first_name,
      lastName: updated.last_name,
      phone: updated.phone,
      bio: updated.bio
    }
  });
}

// POST - изменить пароль
export async function POST(request: NextRequest) {
  const token = extractTokenFromHeader(request);
  const payload = await verifyAccessToken(token);

  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  // Получаем пользователя с хешем пароля
  const user = await prisma.users.findUnique({
    where: { id: payload.userId }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Проверяем текущий пароль
  const isValid = await verifyPassword(currentPassword, user.password_hash);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Неверный текущий пароль' },
      { status: 400 }
    );
  }

  // Хешируем новый пароль
  const newHash = await hashPassword(newPassword);

  // Обновляем
  await prisma.users.update({
    where: { id: payload.userId },
    data: { password_hash: newHash }
  });

  return NextResponse.json({
    success: true,
    message: 'Пароль успешно изменён'
  });
}
```

---

## 🤖 TELEGRAM BOT С ЗАЩИТОЙ

### 1. Активация по ключу

```typescript
// src/lib/telegram/handlers/activation.ts

import { BotContext } from '../bot';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Хранилище состояний (можно использовать Redis)
const userStates = new Map<string, { step: string; data?: any }>();

export async function handleStartCommand(ctx: BotContext) {
  const chatId = ctx.chat?.id.toString();
  if (!chatId) return;

  // Проверяем уже активирован ли пользователь
  const existingUser = await prisma.users.findFirst({
    where: { telegram_chat_id: chatId }
  });

  if (existingUser) {
    await ctx.reply(
      `👋 С возвращением, ${existingUser.first_name}!\n\n` +
      `Используйте /menu для просмотра команд.`
    );
    return;
  }

  // Запрашиваем ключ доступа
  await ctx.reply(
    `🔒 <b>Защищённый бот CafeFlow</b>\n\n` +
    `Для активации бота введите <b>ключ доступа</b>, ` +
    `который вам выдал администратор системы.\n\n` +
    `Формат: <code>CAFEFLOW-XXXX-XXXXXXXX</code>\n\n` +
    `Если у вас нет ключа, обратитесь к администратору.`,
    { parse_mode: 'HTML' }
  );

  // Сохраняем состояние
  userStates.set(chatId, { step: 'awaiting_key' });
}

// Обработка текстовых сообщений
export async function handleTextMessage(ctx: BotContext) {
  const chatId = ctx.chat?.id.toString();
  const text = ctx.message?.text;
  
  if (!chatId || !text) return;

  const state = userStates.get(chatId);

  if (!state) return;

  // Если ожидаем ключ
  if (state.step === 'awaiting_key') {
    await handleKeyInput(ctx, text, chatId);
    return;
  }

  // Если ожидаем email
  if (state.step === 'awaiting_email') {
    await handleEmailInput(ctx, text, chatId, state.data.keyId);
    return;
  }

  // Если ожидаем пароль
  if (state.step === 'awaiting_password') {
    await handlePasswordInput(ctx, text, chatId, state.data);
    return;
  }
}

async function handleKeyInput(ctx: BotContext, key: string, chatId: string) {
  // Проверяем формат ключа
  if (!key.match(/^CAFEFLOW-[A-Z]+-[A-Z0-9]+$/i)) {
    await ctx.reply(
      `❌ Неверный формат ключа.\n\n` +
      `Ожидается: <code>CAFEFLOW-XXXX-XXXXXXXX</code>`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // Проверяем ключ в базе
  const accessKey = await prisma.bot_access_keys.findFirst({
    where: {
      key: key.toUpperCase(),
      is_active: true,
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } }
      ]
    }
  });

  if (!accessKey) {
    await ctx.reply(
      `❌ <b>Неверный или истёкший ключ доступа</b>\n\n` +
      `Проверьте правильность ввода или запросите новый ключ у администратора.`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // Проверяем лимит использований
  if (accessKey.max_uses && accessKey.uses_count >= accessKey.max_uses) {
    await ctx.reply(
      `❌ <b>Ключ исчерпан</b>\n\n` +
      `Этот ключ достиг лимита активаций. Запросите новый у администратора.`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // Ключ валиден!
  await ctx.reply(
    `✅ <b>Ключ принят!</b>\n\n` +
    `Теперь привяжите свой аккаунт CafeFlow.\n\n` +
    `📧 Введите ваш <b>email</b>, который вы используете для входа в систему:`,
    { parse_mode: 'HTML' }
  );

  // Обновляем состояние
  userStates.set(chatId, {
    step: 'awaiting_email',
    data: { keyId: accessKey.id, keyType: accessKey.key_type }
  });
}

async function handleEmailInput(
  ctx: BotContext,
  email: string,
  chatId: string,
  keyId: string
) {
  // Валидация email
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    await ctx.reply(`❌ Неверный формат email. Попробуйте ещё раз:`);
    return;
  }

  // Проверяем существование пользователя
  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    await ctx.reply(
      `❌ <b>Пользователь не найден</b>\n\n` +
      `Email <code>${email}</code> не зарегистрирован в системе.\n\n` +
      `Проверьте правильность или зарегистрируйтесь на сайте сначала.`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // Проверяем что Telegram ещё не привязан
  if (user.telegram_chat_id) {
    await ctx.reply(
      `⚠️ <b>Telegram уже привязан</b>\n\n` +
      `К этому аккаунту уже привязан Telegram.\n\n` +
      `Для перепривязки обратитесь к администратору.`,
      { parse_mode: 'HTML' }
    );
    userStates.delete(chatId);
    return;
  }

  // Запрашиваем пароль
  await ctx.reply(
    `✅ Пользователь найден: <b>${user.first_name} ${user.last_name || ''}</b>\n\n` +
    `🔒 Введите ваш <b>пароль</b> для подтверждения:`,
    { parse_mode: 'HTML' }
  );

  const state = userStates.get(chatId);
  userStates.set(chatId, {
    step: 'awaiting_password',
    data: { ...state?.data, userId: user.id, email }
  });
}

async function handlePasswordInput(
  ctx: BotContext,
  password: string,
  chatId: string,
  data: any
) {
  const { userId, keyId, keyType } = data;

  // Получаем пользователя
  const user = await prisma.users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    await ctx.reply(`❌ Ошибка. Начните заново с /start`);
    userStates.delete(chatId);
    return;
  }

  // Проверяем пароль
  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    await ctx.reply(
      `❌ <b>Неверный пароль</b>\n\n` +
      `Попробуйте ещё раз или начните заново с /start`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // Проверяем роль пользователя vs тип ключа
  if (!isRoleAllowedForKeyType(user.role, keyType)) {
    await ctx.reply(
      `❌ <b>Недостаточно прав</b>\n\n` +
      `Ваша роль (<code>${user.role}</code>) не имеет доступа к этому боту.\n\n` +
      `Обратитесь к администратору.`,
      { parse_mode: 'HTML' }
    );
    userStates.delete(chatId);
    return;
  }

  // ВСЁ ПРОВЕРЕНО! Привязываем аккаунт
  await prisma.$transaction([
    // Обновляем пользователя
    prisma.users.update({
      where: { id: userId },
      data: {
        telegram_chat_id: chatId,
        telegram_username: ctx.from?.username,
        telegram_activated_with_key: keyType,
        two_fa_enabled: true
      }
    }),

    // Записываем активацию ключа
    prisma.bot_key_activations.create({
      data: {
        key_id: keyId,
        user_id: userId,
        telegram_chat_id: chatId
      }
    }),

    // Увеличиваем счётчик использований ключа
    prisma.bot_access_keys.update({
      where: { id: keyId },
      data: { uses_count: { increment: 1 } }
    })
  ]);

  // Удаляем введённый пароль из истории
  await ctx.deleteMessage();

  // Поздравляем!
  await ctx.reply(
    `🎉 <b>Успешно активировано!</b>\n\n` +
    `👤 <b>${user.first_name} ${user.last_name || ''}</b>\n` +
    `🎭 Роль: <code>${getRoleLabel(user.role)}</code>\n` +
    `📧 Email: <code>${user.email}</code>\n\n` +
    `Бот готов к работе! Используйте /menu для просмотра команд.`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '📋 Главное меню', callback_data: 'main_menu' }
        ]]
      }
    }
  );

  // Очищаем состояние
  userStates.delete(chatId);

  logger.info('Telegram bot activated', {
    userId,
    chatId,
    keyType
  });
}

// Проверка соответствия роли и типа ключа
function isRoleAllowedForKeyType(role: string, keyType: string): boolean {
  const permissions: Record<string, string[]> = {
    master: ['admin', 'manager', 'kitchen', 'employee'],
    manager: ['manager', 'kitchen', 'employee'],
    kitchen: ['kitchen'],
    staff: ['employee']
  };

  return permissions[keyType]?.includes(role) || false;
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Администратор',
    manager: 'Менеджер',
    kitchen: 'Кухня',
    employee: 'Сотрудник',
    customer: 'Клиент'
  };
  return labels[role] || role;
}
```

### 2. Генерация ключей доступа (Admin API)

```typescript
// src/app/api/admin/bot-keys/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import crypto from 'crypto';

// GET - список ключей
export async function GET(request: NextRequest) {
  const token = extractTokenFromHeader(request);
  const payload = await verifyAccessToken(token);

  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await prisma.bot_access_keys.findMany({
    where: { created_by: payload.userId },
    include: {
      _count: {
        select: { activations: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return NextResponse.json({ keys });
}

// POST - создать новый ключ
export async function POST(request: NextRequest) {
  const token = extractTokenFromHeader(request);
  const payload = await verifyAccessToken(token);

  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { keyType, description, maxUses, expiresIn } = await request.json();

  // Генерируем ключ
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  const key = `CAFEFLOW-${keyType.toUpperCase().substring(0, 5)}-${randomPart}`;

  // Вычисляем срок действия
  let expiresAt = null;
  if (expiresIn) {
    expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);
  }

  // Создаём ключ
  const accessKey = await prisma.bot_access_keys.create({
    data: {
      key,
      key_type: keyType,
      description,
      max_uses: maxUses || null,
      expires_at: expiresAt,
      created_by: payload.userId
    }
  });

  logger.info('Bot access key created', {
    keyId: accessKey.id,
    keyType,
    createdBy: payload.userId
  });

  return NextResponse.json({
    success: true,
    key: accessKey
  });
}
```

---

## 🎨 FRONTEND КОМПОНЕНТЫ

### 1. Единая страница входа

```typescript
// src/app/[locale]/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      // Сохраняем токен
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      // Перенаправляем по роли
      router.push(data.redirectUrl);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full">
        {/* Лого */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">CafeFlow</h1>
          <p className="text-gray-600 mt-2">Войдите в свой аккаунт</p>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Пароль */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Пароль
                </label>
                <Link 
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Забыли?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Ошибка */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          {/* Регистрация */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Нет аккаунта?{' '}
              <Link 
                href="/register"
                className="text-blue-600 font-medium hover:underline"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>

        {/* Дополнительные ссылки */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### 2. Header с профилем

```typescript
// src/components/Header.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  firstName: string;
  lastName?: string;
  email: string;
  role: string;
  avatar?: string;
}

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to load user', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Лого */}
          <Link href="/" className="text-2xl font-bold text-gray-900">
            CafeFlow
          </Link>

          {/* Навигация */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/menu" className="text-gray-700 hover:text-gray-900">
              Меню
            </Link>
            <Link href="/booking" className="text-gray-700 hover:text-gray-900">
              Бронирование
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-gray-900">
              О нас
            </Link>
          </nav>

          {/* Профиль / Вход */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-3 focus:outline-none"
                >
                  {/* Аватар */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {user.firstName[0]}{user.lastName?.[0] || ''}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getRoleLabel(user.role)}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown меню */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      👤 Профиль
                    </Link>
                    
                    {(user.role === 'admin' || user.role === 'manager') && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        🔧 Админ-панель
                      </Link>
                    )}

                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      📦 Мои заказы
                    </Link>

                    <Link
                      href="/favorites"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      ❤️ Избранное
                    </Link>

                    <hr className="my-2" />

                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      ⚙️ Настройки
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      🚪 Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Администратор',
    manager: 'Менеджер',
    kitchen: 'Кухня',
    employee: 'Сотрудник',
    customer: 'Клиент'
  };
  return labels[role] || role;
}
```

### 3. Страница профиля

```typescript
// src/app/[locale]/profile/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      setUser(data);
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName || '',
        phone: data.phone || '',
        bio: data.bio || ''
      });
    }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      await loadProfile();
      setEditing(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('Пароли не совпадают');
      return;
    }

    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/user/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      })
    });

    if (response.ok) {
      alert('Пароль успешно изменён');
      setChangingPassword(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } else {
      const data = await response.json();
      alert(data.error);
    }
  };

  if (!user) {
    return <div>Загрузка...</div>;
  }

  return (
    <div>
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Профиль</h1>

        {/* Аватар и основная инфо */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
              {user.firstName[0]}{user.lastName?.[0] || ''}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-600">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Редактирование профиля */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Личная информация</h3>
            <button
              onClick={() => editing ? handleSaveProfile() : setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editing ? 'Сохранить' : 'Редактировать'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фамилия
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                О себе
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editing}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Изменение пароля */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Безопасность</h3>
            <button
              onClick={() => setChangingPassword(!changingPassword)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              {changingPassword ? 'Отмена' : 'Изменить пароль'}
            </button>
          </div>

          {changingPassword && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтвердите пароль
                </label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <button
                onClick={handleChangePassword}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Сохранить новый пароль
              </button>
            </div>
          )}
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">12</div>
            <div className="text-gray-600 mt-2">Заказов</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600">5</div>
            <div className="text-gray-600 mt-2">Бронирований</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">350</div>
            <div className="text-gray-600 mt-2">Бонусов</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Администратор',
    manager: 'Менеджер',
    kitchen: 'Кухня',
    employee: 'Сотрудник',
    customer: 'Клиент'
  };
  return labels[role] || role;
}
```

---

## 📅 ПЛАН ВНЕДРЕНИЯ

### **Неделя 1: База данных и роли (2-3 дня)**
- [ ] Обновить enum `user_role` (добавить guest)
- [ ] Добавить поля в `users` (bio, language, timezone, requires_approval)
- [ ] Создать таблицу `user_settings`
- [ ] Создать таблицу `bot_access_keys`
- [ ] Создать таблицу `bot_key_activations`
- [ ] Создать таблицу `access_requests` (для подтверждения входа)
- [ ] Применить миграции

### **Неделя 2: Backend API (3-4 дня)**
- [ ] Единый `/api/auth/login`
- [ ] `/api/auth/register`
- [ ] `/api/user/profile` (GET, PATCH, POST)
- [ ] `/api/admin/bot-keys` (CRUD)
- [ ] Middleware с role-based проверкой
- [ ] Логика redirect по роли

### **Неделя 3: Frontend (3-4 дня)**
- [ ] Страница `/login` (единая)
- [ ] Страница `/register`
- [ ] Компонент `Header` с профилем
- [ ] Страница `/profile`
- [ ] Страница настроек
- [ ] Адаптивный дизайн

### **Неделя 4: Telegram Bot (2-3 дня)**
- [ ] Активация по ключу
- [ ] Проверка пароля
- [ ] Проверка роли
- [ ] Команды бота по ролям
- [ ] Уведомления

### **Неделя 5: Админ-панель управления пользователями (2-3 дня)**
- [ ] `/admin/users` - список пользователей
- [ ] Создание пользователей
- [ ] Редактирование ролей
- [ ] Блокировка/разблокировка
- [ ] Генерация bot keys
- [ ] Просмотр активаций

### **Неделя 6: Тестирование и полировка (2-3 дня)**
- [ ] Тестирование всех ролей
- [ ] Тестирование бота
- [ ] Тестирование профилей
- [ ] Исправление багов
- [ ] Документация

---

## ✅ ИТОГО

**Общее время: 4-6 недель**

### Что получаем:
✅ Единая система входа для всех  
✅ 6 ролей с гибкими правами  
✅ Защищённый Telegram бот (по ключу)  
✅ Профили с аватарами  
✅ Изменение пароля  
✅ Админ-панель для управления  
✅ Подтверждение входа админом (опц)  

**Готовы начать реализацию?** 🚀
