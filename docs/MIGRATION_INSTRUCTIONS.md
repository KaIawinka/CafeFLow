# 🔄 Migration Instructions - Auth System

Инструкции по применению миграции для системы аутентификации.

---

## ⚠️ Перед началом

### 1. Создайте backup базы данных

```bash
# PostgreSQL backup
pg_dump -U your_user -d cafeflow > backup_before_auth_migration.sql

# Или через Prisma Studio export
```

### 2. Убедитесь что БД работает

```bash
# Проверка подключения
npx prisma db pull

# Проверка текущей схемы
npx prisma db execute --stdin < "SELECT version();"
```

---

## 🚀 Способ 1: Автоматическая миграция (Рекомендуется)

### Если БД доступна:

```bash
# 1. Генерируем Prisma Client
npx prisma generate

# 2. Создаем и применяем миграцию
npx prisma migrate dev --name add_auth_system_with_telegram_2fa

# 3. Проверяем результат
npx prisma studio
```

**Что произойдет:**
- Prisma создаст миграцию автоматически
- Применит изменения к БД
- Обновит Prisma Client

---

## 🛠 Способ 2: Ручная миграция

### Если автомат не работает или нужен контроль:

```bash
# 1. Примените SQL вручную
psql -U your_user -d cafeflow -f prisma/migrations/manual_add_auth_system/migration.sql

# 2. Синхронизируйте Prisma
npx prisma db push --skip-generate

# 3. Генерируем Client
npx prisma generate
```

---

## ✅ Проверка миграции

### 1. Проверьте что таблицы созданы:

```sql
-- Подключитесь к БД
psql -U your_user -d cafeflow

-- Проверьте новые таблицы
\dt *auth*
\dt *verification*
\dt *login*
\dt *telegram*

-- Должны появиться:
-- auth_sessions
-- verification_codes
-- login_attempts
-- telegram_link_codes
```

### 2. Проверьте поля в users:

```sql
\d+ users

-- Должны быть добавлены:
-- telegram_chat_id (varchar)
-- telegram_username (varchar)
-- two_fa_enabled (boolean)
-- two_fa_secret (varchar)
```

### 3. Проверьте индексы:

```sql
-- Посмотреть все индексы
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN (
  'auth_sessions', 
  'verification_codes', 
  'login_attempts', 
  'telegram_link_codes',
  'users'
)
ORDER BY tablename, indexname;

-- Должно быть минимум:
-- users: telegram_chat_id (unique), email, telegram_chat_id
-- auth_sessions: token (unique), user_id, expires_at
-- verification_codes: user_id, code, expires_at, type
-- login_attempts: email, ip_address, created_at
-- telegram_link_codes: code (unique), user_id, expires_at
```

### 4. Проверьте foreign keys:

```sql
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('auth_sessions', 'verification_codes')
ORDER BY tc.table_name;

-- Должны быть:
-- auth_sessions.user_id → users.id (CASCADE)
-- verification_codes.user_id → users.id (CASCADE)
```

---

## 🧪 Тестовые данные (опционально)

### Создайте тестового админа:

```sql
-- 1. Создать пользователя
INSERT INTO users (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  display_name,
  role,
  status,
  two_fa_enabled,
  email_verified_at
) VALUES (
  gen_random_uuid(),
  'test@admin.local',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU0J6fQqIxEm', -- "password123"
  'Test',
  'Admin',
  'Test Admin',
  'admin',
  'active',
  true,
  NOW()
);

-- 2. Проверить создание
SELECT id, email, role, two_fa_enabled FROM users WHERE email = 'test@admin.local';
```

**⚠️ Внимание:** Пароль "password123" - только для тестирования! 

---

## 🔧 Откат миграции

### Если что-то пошло не так:

```bash
# 1. Восстановить из backup
psql -U your_user -d cafeflow < backup_before_auth_migration.sql

# 2. Или удалить таблицы вручную
psql -U your_user -d cafeflow
```

```sql
-- Удалить новые таблицы (порядок важен!)
DROP TABLE IF EXISTS telegram_link_codes CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS auth_sessions CASCADE;

-- Удалить поля из users
ALTER TABLE users DROP COLUMN IF EXISTS telegram_chat_id;
ALTER TABLE users DROP COLUMN IF EXISTS telegram_username;
ALTER TABLE users DROP COLUMN IF EXISTS two_fa_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS two_fa_secret;

-- Удалить индексы
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_telegram_chat_id;
```

---

## 📊 Статистика после миграции

### Размер новых таблиц:

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN (
  'auth_sessions',
  'verification_codes',
  'login_attempts',
  'telegram_link_codes'
)
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Количество записей:

```sql
SELECT 
  'auth_sessions' as table_name, COUNT(*) as count FROM auth_sessions
UNION ALL
SELECT 
  'verification_codes', COUNT(*) FROM verification_codes
UNION ALL
SELECT 
  'login_attempts', COUNT(*) FROM login_attempts
UNION ALL
SELECT 
  'telegram_link_codes', COUNT(*) FROM telegram_link_codes;
```

---

## 🎯 Следующие шаги

После успешной миграции:

1. ✅ **Сгенерировать Prisma Client**
   ```bash
   npx prisma generate
   ```

2. ✅ **Создать первого админа через CLI**
   ```bash
   npm run create-admin
   ```

3. ✅ **Настроить Telegram бота**
   - Создать бота через @BotFather
   - Получить токен
   - Добавить в .env

4. ✅ **Запустить dev сервер**
   ```bash
   npm run dev
   ```

5. ✅ **Протестировать логин**
   - Перейти на /admin/login
   - Войти с test админом
   - Проверить 2FA флоу

---

## ❓ Troubleshooting

### Ошибка: "relation already exists"
```bash
# Значит таблица уже создана, пропустите создание
# Или удалите и создайте заново (см. Откат)
```

### Ошибка: "column already exists"
```bash
# Поля уже добавлены в users
# Можно продолжать
```

### Ошибка: "could not create unique index"
```bash
# В таблице есть дубликаты
# Найдите дубликаты:
SELECT telegram_chat_id, COUNT(*) 
FROM users 
WHERE telegram_chat_id IS NOT NULL
GROUP BY telegram_chat_id 
HAVING COUNT(*) > 1;

# Удалите или обновите дубликаты
```

### Prisma Client не видит новые таблицы
```bash
# Регенерируйте
npx prisma generate --force

# Перезапустите TS server в IDE
```

---

## 📝 Changelog

**Версия:** 1.0.0  
**Дата:** January 2026  
**Автор:** CaféFlow Team

**Добавлено:**
- 4 новые таблицы для auth системы
- 4 поля в users для Telegram 2FA
- 10+ индексов для производительности
- Foreign keys с CASCADE delete
- Комментарии к таблицам и полям

**Совместимость:**
- PostgreSQL 14+
- Prisma 7.10+
- Next.js 16+

---

**Статус:** ✅ Готово к применению  
**Риск:** 🟢 Низкий (только добавление, без изменения существующих данных)
