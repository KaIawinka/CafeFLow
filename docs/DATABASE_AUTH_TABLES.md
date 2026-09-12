# 🗄️ Auth System Database Tables

Детальное описание новых таблиц для системы аутентификации.

---

## Обзор

**Добавлено 4 новые таблицы:**
1. `auth_sessions` - Управление сессиями пользователей
2. `verification_codes` - 2FA коды и коды привязки
3. `login_attempts` - Аудит попыток входа
4. `telegram_link_codes` - Коды для привязки Telegram

**Обновлена таблица:** `users` (добавлены поля Telegram)

**Общее количество таблиц:** 30 (было 26)

---

## 1️⃣ auth_sessions

### Назначение
Хранит активные JWT сессии пользователей после успешной аутентификации.

### Поля

```sql
CREATE TABLE auth_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token           VARCHAR(500) UNIQUE NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  ip_address      INET,
  user_agent      VARCHAR(500),
  is_2fa_verified BOOLEAN DEFAULT false NOT NULL,
  last_activity   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions(expires_at);
```

### Бизнес-логика

**Создание:**
- При успешном логине (после проверки пароля)
- `is_2fa_verified = false` изначально
- После верификации 2FA → `is_2fa_verified = true`

**Обновление:**
- `last_activity` обновляется при каждом запросе
- Если `last_activity` > 2 часа → сессия невалидна

**Удаление:**
- Автоматически при logout
- Автоматически при `expires_at`
- Каскадное удаление при удалении пользователя
- Cleanup job удаляет истекшие (cron каждый час)

**Безопасность:**
- Хранится SHA-256 hash токена (не plaintext)
- IP и User-Agent для детекции session hijacking
- Один пользователь может иметь несколько активных сессий (разные устройства)

---

## 2️⃣ verification_codes

### Назначение
Хранит одноразовые коды для 2FA верификации и других операций.

### Поля

```sql
CREATE TABLE verification_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code       VARCHAR(10) NOT NULL,
  type       VARCHAR(50) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  attempts   SMALLINT DEFAULT 0 NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);
CREATE INDEX idx_verification_codes_type ON verification_codes(type);
```

### Типы кодов

| Type | Описание | Срок жизни |
|------|----------|------------|
| `2fa_login` | Код для входа (после пароля) | 5 минут |
| `telegram_link` | Код привязки Telegram | 10 минут |
| `password_reset` | Сброс пароля (будущее) | 30 минут |
| `email_verify` | Подтверждение email (будущее) | 24 часа |

### Бизнес-логика

**Генерация кода:**
```javascript
// 6-значный код
const code = crypto.randomInt(100000, 999999).toString();

// Сохраняем в БД
{
  user_id: userId,
  code: code,
  type: '2fa_login',
  expires_at: new Date(Date.now() + 5 * 60 * 1000), // +5 минут
  attempts: 0
}
```

**Проверка кода:**
```javascript
// 1. Найти активный код
const verification = await prisma.verification_codes.findFirst({
  where: {
    user_id: userId,
    code: inputCode,
    type: '2fa_login',
    used_at: null,
    expires_at: { gt: new Date() }
  }
});

// 2. Проверить попытки
if (verification.attempts >= 3) {
  throw new Error('Превышен лимит попыток');
}

// 3. Инкремент попыток
await prisma.verification_codes.update({
  where: { id: verification.id },
  data: { attempts: { increment: 1 } }
});

// 4. Если код верный
if (verification.code === inputCode) {
  await prisma.verification_codes.update({
    where: { id: verification.id },
    data: { used_at: new Date() }
  });
  return true;
}
```

**Cleanup:**
- Истекшие коды удаляются через 24 часа (для аудита)
- Использованные коды остаются в БД для логов

---

## 3️⃣ login_attempts

### Назначение
Аудит всех попыток входа для безопасности и rate limiting.

### Поля

```sql
CREATE TABLE login_attempts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  user_agent VARCHAR(500),
  success    BOOLEAN NOT NULL,
  reason     VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);
```

### Причины неудачи (reason)

| Reason | Описание |
|--------|----------|
| `invalid_credentials` | Неверный email или пароль |
| `account_locked` | Аккаунт заблокирован |
| `2fa_required` | Требуется 2FA (не ошибка, но логируем) |
| `rate_limit_exceeded` | Превышен лимит попыток |
| `ip_blocked` | IP заблокирован |
| `invalid_2fa_code` | Неверный 2FA код |

### Бизнес-логика

**Логирование:**
```javascript
// При каждой попытке логина
await prisma.login_attempts.create({
  data: {
    email: email,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    success: false,
    reason: 'invalid_credentials'
  }
});
```

**Rate Limiting:**
```javascript
// Проверка лимита по email
const recentAttempts = await prisma.login_attempts.count({
  where: {
    email: email,
    success: false,
    created_at: {
      gte: new Date(Date.now() - 15 * 60 * 1000) // 15 минут
    }
  }
});

if (recentAttempts >= 5) {
  throw new Error('Слишком много попыток. Попробуйте через 15 минут.');
}

// Проверка лимита по IP
const ipAttempts = await prisma.login_attempts.count({
  where: {
    ip_address: req.ip,
    success: false,
    created_at: {
      gte: new Date(Date.now() - 60 * 60 * 1000) // 1 час
    }
  }
});

if (ipAttempts >= 10) {
  throw new Error('IP временно заблокирован');
}
```

**Аналитика:**
- График попыток входа по времени
- Топ IP с неудачными попытками
- Статистика по причинам отказа

**Cleanup:**
- Записи старше 90 дней удаляются (GDPR compliance)

---

## 4️⃣ telegram_link_codes

### Назначение
Одноразовые коды для безопасной привязки Telegram к аккаунту.

### Поля

```sql
CREATE TABLE telegram_link_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  code       VARCHAR(50) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_telegram_link_codes_code ON telegram_link_codes(code);
CREATE INDEX idx_telegram_link_codes_user_id ON telegram_link_codes(user_id);
CREATE INDEX idx_telegram_link_codes_expires_at ON telegram_link_codes(expires_at);
```

### Бизнес-логика

**Генерация кода:**
```javascript
// Уникальный код: UUID без дефисов
const code = crypto.randomUUID().replace(/-/g, '');

await prisma.telegram_link_codes.create({
  data: {
    user_id: userId,
    code: code,
    expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 минут
  }
});

// Ссылка для пользователя
const link = `https://t.me/${BOT_USERNAME}?start=${code}`;
```

**Процесс привязки:**
```javascript
// 1. Пользователь переходит по ссылке
// 2. Telegram отправляет webhook: /start ${code}

// 3. Бот проверяет код
const linkCode = await prisma.telegram_link_codes.findUnique({
  where: { 
    code: code,
    used_at: null,
    expires_at: { gt: new Date() }
  },
  include: { user: true }
});

// 4. Если валидный - сохраняем chat_id
await prisma.users.update({
  where: { id: linkCode.user_id },
  data: {
    telegram_chat_id: message.chat.id.toString(),
    telegram_username: message.from.username,
    two_fa_enabled: true
  }
});

// 5. Помечаем код использованным
await prisma.telegram_link_codes.update({
  where: { id: linkCode.id },
  data: { used_at: new Date() }
});
```

**Безопасность:**
- Код одноразовый
- Срок жизни 10 минут
- После использования нельзя переиспользовать
- Нельзя привязать один Telegram к нескольким аккаунтам

---

## 🔄 Связи между таблицами

```
users (1) ───→ (N) auth_sessions
users (1) ───→ (N) verification_codes
users (1) ───→ (N) telegram_link_codes

login_attempts ───× (независимая, только логи)
```

**Cascade Delete:**
- При удалении `users` → удаляются все его сессии, коды, и т.д.
- Это безопасно, т.к. user удаление = полная очистка

---

## 📈 Производительность

### Индексы

**Критичные для производительности:**
```sql
-- Быстрая проверка токена
idx_auth_sessions_token (UNIQUE)

-- Поиск кодов при верификации
idx_verification_codes_code + idx_verification_codes_user_id

-- Rate limiting
idx_login_attempts_email
idx_login_attempts_ip_address
idx_login_attempts_created_at

-- Cleanup задачи
idx_auth_sessions_expires_at
idx_verification_codes_expires_at
```

### Оценка размера

**При 1000 админов:**
- `auth_sessions`: ~2-5 записей на юзера = 2-5K записей = ~500KB
- `verification_codes`: ~10 записей/месяц/юзер = ~10K/месяц = ~200KB
- `login_attempts`: ~20 попыток/день/юзер = ~600K/месяц = ~10MB
- `telegram_link_codes`: ~1-2 на юзера = 1-2K = ~50KB

**Итого:** ~11MB/месяц для 1000 админов - минимально.

### Cleanup стратегия

```sql
-- Запускать ежедневно (cron)

-- Удалить истекшие сессии
DELETE FROM auth_sessions 
WHERE expires_at < NOW() - INTERVAL '1 day';

-- Удалить старые коды
DELETE FROM verification_codes 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Удалить старые попытки входа
DELETE FROM login_attempts 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Удалить истекшие коды привязки
DELETE FROM telegram_link_codes 
WHERE created_at < NOW() - INTERVAL '1 day';
```

---

## 🔐 Безопасность на уровне БД

### Row Level Security (RLS)

Если используется PostgreSQL RLS:

```sql
-- Админы видят только свои данные
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_isolation ON auth_sessions
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid);
```

### Шифрование

**Что НЕ нужно шифровать:**
- `telegram_chat_id` - не секретная информация
- `code` - краткоживущий, не критично

**Что шифровать (опционально):**
- `two_fa_secret` - если используется TOTP
- `token` - хранить как hash, не plaintext

### Аудит

Все критичные операции логируются:
- Создание/удаление сессий → `activity_logs`
- Изменение 2FA настроек → `activity_logs`
- Привязка/отвязка Telegram → `activity_logs`

---

## 📝 Примеры запросов

### Получить активные сессии пользователя
```sql
SELECT 
  s.id,
  s.ip_address,
  s.user_agent,
  s.last_activity,
  s.created_at
FROM auth_sessions s
WHERE s.user_id = $1
  AND s.expires_at > NOW()
  AND s.is_2fa_verified = true
ORDER BY s.last_activity DESC;
```

### Проверить rate limit по email
```sql
SELECT COUNT(*) as failed_attempts
FROM login_attempts
WHERE email = $1
  AND success = false
  AND created_at > NOW() - INTERVAL '15 minutes';
```

### Найти подозрительные IP
```sql
SELECT 
  ip_address,
  COUNT(*) as failed_count,
  MAX(created_at) as last_attempt
FROM login_attempts
WHERE success = false
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) >= 10
ORDER BY failed_count DESC;
```

### Получить валидный 2FA код
```sql
SELECT *
FROM verification_codes
WHERE user_id = $1
  AND type = '2fa_login'
  AND used_at IS NULL
  AND expires_at > NOW()
  AND attempts < 3
ORDER BY created_at DESC
LIMIT 1;
```

---

**Статус:** ✅ Документация готова
**Следующий шаг:** Применить миграцию
