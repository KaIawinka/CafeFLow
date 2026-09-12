# 🔐 CaféFlow Authentication System

Полная документация системы аутентификации с Telegram 2FA.

---

## 📊 Обновленная схема БД

### Новые таблицы:

#### 1. `auth_sessions` - Сессии пользователей
Хранит активные сессии после успешной аутентификации.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | ID сессии |
| user_id | UUID | FK → users |
| token | String(500) | JWT токен (уникальный) |
| expires_at | Timestamp | Время истечения |
| ip_address | INET | IP адрес |
| user_agent | String(500) | Браузер/устройство |
| is_2fa_verified | Boolean | Прошел ли 2FA |
| last_activity | Timestamp | Последняя активность |
| created_at | Timestamp | Создана |

**Индексы:** user_id, token, expires_at

**Cascade Delete:** При удалении пользователя удаляются все его сессии

---

#### 2. `verification_codes` - Коды для 2FA
Хранит одноразовые коды для верификации.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | ID кода |
| user_id | UUID | FK → users |
| code | String(10) | 6-значный код |
| type | String(50) | "2fa_login" / "telegram_link" |
| expires_at | Timestamp | Истекает через 5 минут |
| used_at | Timestamp? | Когда использован |
| attempts | SmallInt | Количество попыток (макс 3) |
| ip_address | INET? | IP запроса |
| created_at | Timestamp | Создан |

**Индексы:** user_id, code, expires_at, type

**Лимиты:**
- Срок жизни: 5 минут
- Попытки: 3 максимум
- После использования помечается `used_at`

---

#### 3. `login_attempts` - Лог попыток входа
Отслеживает все попытки входа для безопасности.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | ID записи |
| email | String(255) | Email попытки |
| ip_address | INET | IP адрес |
| user_agent | String(500) | Браузер |
| success | Boolean | Успешная? |
| reason | String(255)? | Причина отказа |
| created_at | Timestamp | Время попытки |

**Индексы:** email, ip_address, created_at

**Назначение:**
- Аудит безопасности
- Rate limiting (5 попыток / 15 минут)
- Обнаружение атак
- Блокировка подозрительных IP

---

#### 4. `telegram_link_codes` - Коды привязки Telegram
Одноразовые коды для связывания аккаунта с Telegram.

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | ID записи |
| user_id | UUID | Пользователь |
| code | String(50) | Уникальный код |
| expires_at | Timestamp | Истекает через 10 мин |
| used_at | Timestamp? | Когда использован |
| created_at | Timestamp | Создан |

**Индексы:** code (unique), user_id, expires_at

**Процесс:**
1. Админ запрашивает привязку → генерируется код
2. Переходит `t.me/bot?start=CODE`
3. Бот проверяет код → сохраняет chat_id
4. Код помечается использованным

---

### Обновления в `users`:

Добавлены поля для Telegram 2FA:

```prisma
telegram_chat_id  String?  @unique    // Telegram chat ID
telegram_username String?             // @username в TG
two_fa_enabled    Boolean  @default(false)  // 2FA включен
two_fa_secret     String?             // Доп. секрет (резерв)
```

**Новые индексы:**
- `email` - для быстрого поиска при логине
- `telegram_chat_id` - для отправки кодов

---

## 🔒 Безопасность

### Пароли
- **Хеширование:** bcrypt
- **Salt rounds:** 12 (настраиваемо)
- **Минимум:** 8 символов
- **Требования:** буквы + цифры (настраиваемо)

### 2FA коды
- **Длина:** 6 цифр
- **Генерация:** `crypto.randomInt(100000, 999999)`
- **Срок жизни:** 5 минут
- **Попытки:** 3 максимум
- **Формат:** `123456`

### Сессии
- **Токен:** JWT в httpOnly cookie
- **Срок жизни:** 8 часов (настраиваемо)
- **Неактивность:** 2 часа → logout
- **Обновление:** При каждом запросе обновляется `last_activity`

### Rate Limiting
- **Логин:** 5 попыток / 15 минут по email
- **2FA:** 3 попытки / 5 минут по коду
- **IP блокировка:** После 10 неудачных попыток / час
- **Автоматическая разблокировка:** Через 1 час

---

## 🔄 Флоу аутентификации

### 1. Первичная настройка админа

```
CLI команда: npm run create-admin
↓
Создание пользователя в БД:
  - role = admin
  - status = active
  - password_hash (bcrypt)
  - two_fa_enabled = true
↓
Генерация telegram_link_codes
↓
Вывод: "Привяжите Telegram: t.me/bot?start=CODE"
↓
Админ переходит по ссылке
↓
Бот проверяет код → сохраняет chat_id
↓
✅ Готов к использованию
```

### 2. Процесс логина (каждый раз)

```
POST /api/auth/login
{
  email: "admin@cafe.com",
  password: "********"
}
↓
Проверка credentials (bcrypt.compare)
↓
Лог в login_attempts (success: true)
↓
Проверка: two_fa_enabled?
  Да → Генерация кода
     → Создание verification_codes
     → Отправка в Telegram
     → Создание auth_sessions (is_2fa_verified: false)
     → Возврат: { requires2FA: true, sessionId: "xxx" }
  Нет → Полная сессия сразу
↓
POST /api/auth/verify-2fa
{
  sessionId: "xxx",
  code: "123456"
}
↓
Проверка кода:
  - Не истек?
  - Не использован?
  - Совпадает?
  - Попытки < 3?
↓
Если OK:
  - used_at = now()
  - is_2fa_verified = true
  - JWT в httpOnly cookie
  - ✅ Доступ разрешен
↓
Если НЕ OK:
  - attempts++
  - Если attempts >= 3:
      → Код недействителен
      → Нужен новый код
```

### 3. Проверка доступа (middleware)

```
Request → /admin/*
↓
Читаем JWT из cookie
↓
Проверяем:
  1. Токен валидный?
  2. Сессия существует в БД?
  3. Сессия не истекла?
  4. is_2fa_verified = true?
  5. Роль в [admin, manager, employee]?
↓
Если ОК:
  - Обновляем last_activity
  - Пропускаем запрос
Если НЕТ:
  - 401 Unauthorized
  - Редирект → /admin/login
```

---

## 📱 Telegram Bot интеграция

### Команды бота:

- `/start CODE` - Привязка аккаунта (с кодом из системы)
- `/status` - Проверка текущей привязки
- `/help` - Помощь по командам

### Отправка 2FA кодов:

```typescript
bot.api.sendMessage(telegram_chat_id, `
🔐 Код для входа в CaféFlow Admin

Ваш код: <code>${code}</code>

⏰ Действителен 5 минут
🔢 Осталось попыток: 3

Если это не вы, немедленно свяжитесь с администратором!
`, { parse_mode: 'HTML' });
```

---

## 🛡 Защита от атак

### Brute Force
- Лимит попыток логина по email
- Exponential backoff при неудачах
- Временная блокировка IP
- CAPTCHA после 3 неудачных попыток (опционально)

### Timing Attacks
- Константное время проверки паролей (bcrypt)
- Одинаковое время ответа при валидном/невалидном email

### Session Hijacking
- httpOnly cookies (нет доступа из JS)
- Secure flag в production
- SameSite=Strict
- Проверка IP и User-Agent

### CSRF
- Token в форме логина
- Проверка Origin header

---

## 📝 Environment Variables

```bash
# JWT секрет (случайная строка 64+ символов)
JWT_SECRET="..."

# Telegram бот токен (из @BotFather)
TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."

# Webhook секрет (случайная строка)
TELEGRAM_WEBHOOK_SECRET="..."

# Rate limiting
MAX_LOGIN_ATTEMPTS=5
MAX_2FA_ATTEMPTS=3
CODE_EXPIRY_MINUTES=5
```

---

## 🧪 Тестовые сценарии

### ✅ Успешный логин
1. Валидный email + пароль
2. Код приходит в Telegram
3. Правильный код → доступ

### ❌ Неудачный логин
1. Неверный пароль → error
2. Email не существует → error (такой же как при неверном пароле)
3. Аккаунт заблокирован → specific error

### ❌ 2FA fail
1. Неверный код 3 раза → блокировка
2. Истекший код → error + предложение нового
3. Уже использованный код → error

### 🔄 Rate limiting
1. 5 неудачных попыток → временная блокировка
2. Разные IP → независимые счетчики

---

## 🔧 Миграции

```bash
# Создать миграцию
npx prisma migrate dev --name add_auth_system

# Применить в production
npx prisma migrate deploy

# Сгенерировать Prisma Client
npx prisma generate
```

---

## 📊 Мониторинг

### Метрики для отслеживания:
- Количество неудачных логинов / час
- Среднее время до 2FA верификации
- Количество истекших кодов
- Активные сессии
- Заблокированные IP

### Алерты:
- 🔴 Более 10 неудачных попыток с одного IP
- 🟡 Более 5 истекших кодов от одного юзера
- 🔴 Попытка входа с заблокированного IP
- 🟡 Сессия старше 24 часов

---

**Статус:** ✅ Schema готова
**Следующий шаг:** Настройка Telegram бота
