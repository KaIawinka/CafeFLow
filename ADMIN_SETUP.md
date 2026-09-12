# 🔐 Настройка Админки CaféFlow

Пошаговая инструкция по настройке административной панели с 2FA через Telegram.

---

## 📋 Что нужно

1. PostgreSQL база данных (Neon)
2. Telegram Bot Token
3. Telegram Chat ID администратора

---

## 🚀 Шаг 1: Примените миграцию

Миграция уже создана автоматически. Примените её:

```bash
npx prisma migrate deploy
```

Это создаст таблицу `settings` в базе данных.

---

## 👤 Шаг 2: Создайте первого админа

### Вариант A: Через SQL (Neon Console)

1. Откройте Neon Console → SQL Editor
2. Сгенерируйте hash пароля:

```bash
npx bcrypt-cli hash "ваш-пароль" 10
```

3. Выполните SQL:

```sql
INSERT INTO users (
  id, email, password_hash, first_name, role, status, 
  two_fa_enabled, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'admin@cafeflow.com',
  '$2b$10$ВАШ_ХЕШ_ПАРОЛЯ_СЮДА',
  'Admin',
  'admin',
  'active',
  false,
  NOW(),
  NOW()
);
```

### Вариант B: Через Node.js скрипт

Создайте файл `create-admin.js`:

```javascript
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@cafeflow.com';
  const password = 'ваш-пароль';
  
  const passwordHash = await bcrypt.hash(password, 10);
  
  const admin = await prisma.users.create({
    data: {
      email,
      password_hash: passwordHash,
      first_name: 'Admin',
      role: 'admin',
      status: 'active',
      two_fa_enabled: false,
    },
  });
  
  console.log('✅ Admin created:', admin.email);
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Запустите:

```bash
node create-admin.js
```

---

## 📱 Шаг 3: Получите Telegram Chat ID

### Способ 1: Через бота

1. Откройте вашего бота в Telegram
2. Напишите `/start`
3. Получите свой Chat ID через специальную команду или используйте способ 2

### Способ 2: Через API

1. Напишите любое сообщение боту
2. Откройте в браузере:

```
https://api.telegram.org/bot<ВАШ_BOT_TOKEN>/getUpdates
```

3. Найдите `"chat":{"id":123456789}` - это ваш Chat ID

### Способ 3: Через @userinfobot

1. Найдите бота `@userinfobot` в Telegram
2. Напишите `/start`
3. Бот покажет ваш ID

---

## ⚙️ Шаг 4: Настройте Settings

Выполните SQL в Neon Console:

```sql
-- Telegram Chat ID администратора
INSERT INTO settings (id, key, value, description, is_public, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_USER_ID',
  '123456789',  -- ← Ваш реальный Chat ID
  'Telegram Chat ID администратора для получения 2FA кодов',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = NOW();

-- Bot Token (опционально - использует env TELEGRAM_BOT_TOKEN если не задан)
INSERT INTO settings (id, key, value, description, is_public, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_BOT_TOKEN',
  'your_bot_token_here',  -- ← Ваш Bot Token (опционально)
  'Telegram Bot токен для отправки 2FA кодов',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = NOW();
```

**Или используйте готовый скрипт:**

```bash
# Отредактируйте prisma/seed-settings.sql
# Замените YOUR_TELEGRAM_CHAT_ID и YOUR_BOT_TOKEN
# Затем выполните:
psql $DATABASE_URL -f prisma/seed-settings.sql
```

---

## ✅ Шаг 5: Проверьте настройку

1. Откройте `https://ваш-домен.vercel.app/admin/login`
2. Введите email и пароль админа
3. Вы должны получить 6-значный код в Telegram
4. Введите код для входа

---

## 🔒 Система защиты

### Что защищено:

✅ Маршрут `/admin/*` требует роль `admin`  
✅ Авторизованный админ не может зайти на лендинг  
✅ Обычные пользователи не могут зайти в админку  
✅ Токены хранятся в httpOnly cookies  
✅ Middleware проверяет роли на каждом запросе  

### Логика доступа:

| Пользователь | Лендинг `/` | Админка `/admin` |
|--------------|-------------|------------------|
| Гость | ✅ | ❌ Redirect → /admin/login |
| User (customer) | ✅ | ❌ Redirect → / |
| Admin | ❌ Redirect → /admin/dashboard | ✅ |

---

## 🐛 Проблемы и решения

### Код не приходит в Telegram

**Проверьте:**

1. `ADMIN_TELEGRAM_USER_ID` в settings правильный
2. Bot Token валидный (`TELEGRAM_BOT_TOKEN` или `ADMIN_TELEGRAM_BOT_TOKEN`)
3. Вы написали `/start` боту хотя бы раз
4. Проверьте логи: `src/lib/logger.ts` пишет в консоль

**Проверка через curl:**

```bash
curl -X POST https://api.telegram.org/bot<BOT_TOKEN>/sendMessage \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "<YOUR_CHAT_ID>",
    "text": "Test message"
  }'
```

### Ошибка "ADMIN_TELEGRAM_USER_ID not configured"

Выполните SQL из Шага 4.

### Ошибка "Неверный email или пароль"

Проверьте:
1. Email существует в таблице `users`
2. Роль пользователя = `admin`
3. Статус = `active`
4. `password_hash` корректный (сгенерирован через bcrypt с rounds=10)

### Код истекает слишком быстро

По умолчанию 5 минут. Измените в `src/app/api/admin/auth/login/route.ts`:

```typescript
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут
```

---

## 📊 Проверка данных

### Проверить админа:

```sql
SELECT id, email, role, status, telegram_chat_id 
FROM users 
WHERE role = 'admin';
```

### Проверить settings:

```sql
SELECT key, value, description 
FROM settings 
WHERE key LIKE 'ADMIN%';
```

### Проверить коды 2FA:

```sql
SELECT user_id, code, type, expires_at, used_at, attempts
FROM verification_codes 
WHERE type = 'admin_2fa_login'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎨 Кастомизация

### Изменить время жизни токенов

Файл: `src/lib/auth/jwt.ts`

```typescript
const ACCESS_TOKEN_EXPIRY = '15m';  // ← измените
const REFRESH_TOKEN_EXPIRY = '7d';  // ← измените
```

### Изменить количество попыток 2FA

Файл: `src/app/api/admin/auth/verify-2fa/route.ts`

Найдите `attemptsLeft = Math.max(0, 3 - ...)` и измените `3`.

---

## 📝 Следующие шаги

После успешной настройки:

1. ✅ Войдите в админку
2. 📊 Добавьте функционал управления меню
3. 👥 Добавьте управление пользователями
4. 📈 Подключите аналитику
5. 🔔 Настройте уведомления

---

**Готово! Админка настроена и защищена 🎉**
