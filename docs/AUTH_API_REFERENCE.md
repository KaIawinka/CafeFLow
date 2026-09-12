# 🔐 Auth API Reference

Полная документация Authentication API для CaféFlow Admin Panel.

---

## 📋 Оглавление

1. [Обзор](#обзор)
2. [Архитектура аутентификации](#архитектура-аутентификации)
3. [Endpoints](#endpoints)
4. [Примеры использования](#примеры-использования)
5. [Коды ошибок](#коды-ошибок)
6. [Безопасность](#безопасность)

---

## Обзор

CaféFlow использует **JWT (JSON Web Tokens)** для аутентификации и **Telegram 2FA** для дополнительной защиты.

### Основные возможности:

✅ Email/Password аутентификация  
✅ JWT Access & Refresh токены  
✅ 2FA через Telegram  
✅ Привязка Telegram аккаунта  
✅ Role-based access (admin, manager, staff)  
✅ Session management  
✅ Rate limiting  

---

## Архитектура аутентификации

### 🔄 Процесс входа с 2FA

```
1. POST /api/auth/login
   ├─ Email + Password
   ├─ Проверка credentials
   └─ Если 2FA включен:
      ├─ Генерация 6-значного кода
      ├─ Отправка в Telegram
      └─ Возврат tempSessionId
   
2. POST /api/auth/verify-2fa
   ├─ Email + Code
   ├─ Проверка кода
   └─ Выдача JWT токенов
      ├─ accessToken (15 минут)
      └─ refreshToken (7 дней)

3. GET /api/auth/session
   ├─ Authorization: Bearer {accessToken}
   └─ Возврат user info
```

### 🔄 Процесс входа без 2FA

```
1. POST /api/auth/login
   ├─ Email + Password
   ├─ Проверка credentials
   └─ Сразу выдача JWT токенов
```

### 🔗 Процесс привязки Telegram

```
1. GET /api/auth/telegram/link-code
   ├─ Authorization: Bearer {accessToken}
   ├─ Генерация link code (10 мин)
   └─ Возврат t.me ссылки

2. Пользователь переходит по ссылке
   └─ Telegram открывает бота с /start CODE

3. Бот обрабатывает код
   ├─ Проверяет в БД
   ├─ Сохраняет telegram_chat_id
   ├─ Устанавливает two_fa_enabled = true
   └─ Отправляет подтверждение
```

---

## Endpoints

### 1. POST /api/auth/login

**Первый шаг аутентификации** - проверка email и пароля.

#### Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@cafeflow.local",
  "password": "SecurePass123!"
}
```

#### Response (с 2FA)

```json
{
  "requires2FA": true,
  "tempSessionId": "uuid-here",
  "message": "Код подтверждения отправлен в Telegram",
  "expiresInMinutes": 5
}
```

#### Response (без 2FA)

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@cafeflow.local",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "twoFAEnabled": false
  }
}
```

#### Ошибки

| Код | Описание |
|-----|----------|
| 400 | Email и пароль обязательны |
| 401 | Неверный email или пароль |
| 403 | Аккаунт заблокирован |
| 429 | Слишком много запросов кода |
| 500 | Не удалось отправить код / Внутренняя ошибка |

---

### 2. POST /api/auth/verify-2fa

**Второй шаг аутентификации** - проверка 2FA кода из Telegram.

#### Request

```http
POST /api/auth/verify-2fa
Content-Type: application/json

{
  "email": "admin@cafeflow.local",
  "code": "123456"
}
```

#### Response (успех)

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@cafeflow.local",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "twoFAEnabled": true
  }
}
```

#### Response (ошибка)

```json
{
  "error": "Неверный код. Осталось попыток: 2",
  "attemptsLeft": 2
}
```

#### Ошибки

| Код | Описание |
|-----|----------|
| 400 | Email и код обязательны / Код должен состоять из 6 цифр / 2FA не включен |
| 401 | Неверный код |
| 403 | Аккаунт заблокирован |
| 404 | Пользователь не найден |
| 500 | Внутренняя ошибка |

---

### 3. GET /api/auth/session

**Проверка текущей сессии** - получение информации о пользователе.

#### Request

```http
GET /api/auth/session
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response

```json
{
  "user": {
    "id": "uuid",
    "email": "admin@cafeflow.local",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+996555123456",
    "role": "admin",
    "status": "active",
    "twoFAEnabled": true,
    "telegramLinked": true,
    "lastLoginAt": "2026-01-11T10:30:00.000Z",
    "createdAt": "2025-12-01T08:00:00.000Z"
  },
  "session": {
    "sessionId": "uuid",
    "expiresAt": "2026-01-11T10:45:00.000Z"
  }
}
```

#### Ошибки

| Код | Описание |
|-----|----------|
| 401 | Токен не предоставлен / Недействительный или истёкший токен |
| 403 | Аккаунт заблокирован |
| 404 | Пользователь не найден |
| 500 | Внутренняя ошибка |

---

### 4. POST /api/auth/logout

**Выход из системы** - инвалидация токена.

#### Request

```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response

```json
{
  "success": true,
  "message": "Выход выполнен успешно"
}
```

**Note:** Клиент должен удалить токены из localStorage/cookies.

#### Ошибки

| Код | Описание |
|-----|----------|
| 401 | Токен не предоставлен / Недействительный токен |
| 500 | Внутренняя ошибка |

---

### 5. GET /api/auth/telegram/link-code

**Генерация кода для привязки Telegram** - требует авторизации.

#### Request

```http
GET /api/auth/telegram/link-code
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response

```json
{
  "success": true,
  "code": "abc123xyz456",
  "linkUrl": "https://t.me/cafeflow_admin_bot?start=abc123xyz456",
  "expiresInMinutes": 10,
  "instructions": [
    "Нажмите на ссылку ниже или откройте её в браузере",
    "Telegram откроется автоматически",
    "Нажмите START в боте",
    "Ваш аккаунт будет привязан автоматически"
  ]
}
```

#### Ошибки

| Код | Описание |
|-----|----------|
| 400 | Telegram уже привязан к этому аккаунту |
| 401 | Токен не предоставлен / Недействительный токен |
| 404 | Пользователь не найден |
| 500 | Внутренняя ошибка |

---

## Примеры использования

### 🟢 JavaScript/TypeScript

#### Вход с 2FA

```typescript
// Шаг 1: Логин
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@cafeflow.local',
    password: 'SecurePass123!',
  }),
});

const loginData = await loginResponse.json();

if (loginData.requires2FA) {
  // Показать форму ввода кода
  const code = prompt('Введите код из Telegram:');
  
  // Шаг 2: Проверка кода
  const verifyResponse = await fetch('/api/auth/verify-2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@cafeflow.local',
      code,
    }),
  });
  
  const verifyData = await verifyResponse.json();
  
  if (verifyData.success) {
    // Сохранить токены
    localStorage.setItem('accessToken', verifyData.accessToken);
    localStorage.setItem('refreshToken', verifyData.refreshToken);
    
    // Редирект в админку
    window.location.href = '/admin/dashboard';
  }
} else {
  // Без 2FA - сразу сохранить токены
  localStorage.setItem('accessToken', loginData.accessToken);
  localStorage.setItem('refreshToken', loginData.refreshToken);
  
  window.location.href = '/admin/dashboard';
}
```

#### Проверка сессии

```typescript
const token = localStorage.getItem('accessToken');

const response = await fetch('/api/auth/session', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

if (response.ok) {
  const { user, session } = await response.json();
  console.log('Пользователь:', user);
  console.log('Сессия истекает:', session.expiresAt);
} else if (response.status === 401) {
  // Токен истёк - редирект на логин
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/admin/login';
}
```

#### Выход

```typescript
const token = localStorage.getItem('accessToken');

await fetch('/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Удалить токены
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');

// Редирект на логин
window.location.href = '/admin/login';
```

#### Привязка Telegram

```typescript
const token = localStorage.getItem('accessToken');

const response = await fetch('/api/auth/telegram/link-code', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const { linkUrl, instructions } = await response.json();

// Показать ссылку пользователю
alert(`Перейдите по ссылке:\n${linkUrl}`);

// Или открыть автоматически
window.open(linkUrl, '_blank');
```

---

### 🟢 cURL

#### Вход

```bash
# Шаг 1: Логин
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cafeflow.local",
    "password": "SecurePass123!"
  }'

# Ответ: { "requires2FA": true, "tempSessionId": "..." }

# Шаг 2: Проверка 2FA
curl -X POST http://localhost:3000/api/auth/verify-2fa \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cafeflow.local",
    "code": "123456"
  }'

# Ответ: { "accessToken": "...", "refreshToken": "..." }
```

#### Проверка сессии

```bash
curl http://localhost:3000/api/auth/session \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Выход

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Привязка Telegram

```bash
curl http://localhost:3000/api/auth/telegram/link-code \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Коды ошибок

### HTTP Status Codes

| Код | Название | Когда возвращается |
|-----|----------|-------------------|
| 200 | OK | Успешный запрос |
| 400 | Bad Request | Невалидные данные |
| 401 | Unauthorized | Не авторизован / Неверные credentials |
| 403 | Forbidden | Доступ запрещён / Аккаунт заблокирован |
| 404 | Not Found | Ресурс не найден |
| 429 | Too Many Requests | Rate limit превышен |
| 500 | Internal Server Error | Ошибка сервера |

### Формат ошибок

```json
{
  "error": "Описание ошибки на русском",
  "attemptsLeft": 2
}
```

---

## Безопасность

### 🔐 JWT Токены

**Access Token:**
- Время жизни: 15 минут
- Используется для всех API запросов
- Алгоритм: HS256
- Payload: `{ userId, email, role, sessionId }`

**Refresh Token:**
- Время жизни: 7 дней
- Используется для обновления access token (TODO)
- Алгоритм: HS256
- Payload: `{ userId, sessionId }`

### 🔑 Переменные окружения

```bash
# JWT Secret (ОБЯЗАТЕЛЬНО поменять в production!)
JWT_SECRET="your-super-secret-key-min-32-chars"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-bot-token"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="your_bot_username"
TELEGRAM_WEBHOOK_SECRET="your-webhook-secret"
```

### 🛡️ Best Practices

✅ **Храните токены безопасно**
- В production используйте httpOnly cookies
- Или храните в memory (не в localStorage)
- Или используйте secure localStorage с шифрованием

✅ **HTTPS обязателен в production**
- Все API запросы через HTTPS
- Telegram webhook требует HTTPS

✅ **Rate Limiting**
- Максимум 3 кода за 5 минут
- Максимум 3 попытки ввода кода
- Блокировка после превышения

✅ **Password Policy**
- Минимум 8 символов
- Заглавные и строчные буквы
- Цифры
- Специальные символы

✅ **2FA Коды**
- 6 цифр
- Время жизни: 5 минут
- Одноразовые (нельзя повторно использовать)

✅ **Логирование**
- Все попытки входа
- Неудачные авторизации
- IP адреса
- User agents

---

## 🔄 Middleware

### Защита роутов

Middleware автоматически защищает:
- `/admin/*` - все админ страницы
- `/api/admin/*` - все админ API

### Role-Based Access

```typescript
// Только для admin
'/api/admin/users'
'/api/admin/settings'

// Для admin и manager
'/api/admin/menu'
'/api/admin/orders'
```

### Исключения

Публичные роуты (не требуют авторизации):
- `/admin/login`
- `/admin/verify-2fa`
- `/api/auth/login`
- `/api/auth/verify-2fa`

---

## 📝 Changelog

### Version 1.0.0 (January 2026)

✅ **Реализовано:**
- JWT аутентификация (jose)
- Password hashing (bcrypt, 12 rounds)
- 2FA через Telegram
- Login endpoint
- Verify 2FA endpoint
- Session check endpoint
- Logout endpoint
- Telegram link code generation
- Next.js Middleware для защиты роутов
- Role-based access control
- Rate limiting
- Logging

🔄 **TODO:**
- Refresh token endpoint
- Token blacklist (Redis)
- Password reset flow
- Email verification
- OAuth providers (Google, Facebook)
- Device management
- Session history

---

## 🆘 Troubleshooting

### Проблема: "Недействительный или истёкший токен"

**Решение:**
1. Access token истекает через 15 минут
2. Проверьте что передаёте правильный header: `Authorization: Bearer {token}`
3. Используйте refresh token для обновления (TODO)
4. Или залогиньтесь заново

### Проблема: "Код не найден или истёк"

**Решение:**
1. 2FA код действует 5 минут
2. Запросите новый код через повторный логин
3. Проверьте rate limit (3 кода за 5 минут)

### Проблема: "Telegram уже привязан"

**Решение:**
1. Telegram можно привязать только один раз
2. Для перепривязки нужно сначала отвязать (TODO endpoint)

---

## 📞 Поддержка

**Документация:**
- [Telegram Bot Setup](./TELEGRAM_BOT_SETUP.md)
- [Database Schema](../prisma/schema.prisma)

**Контакты:**
- Email: support@cafeflow.local
- Telegram: @cafeflow_support

---

**Версия:** 1.0.0  
**Дата:** January 2026  
**Статус:** ✅ Production Ready
