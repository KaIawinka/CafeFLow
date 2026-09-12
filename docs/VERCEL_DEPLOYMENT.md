# 🚀 Vercel Deployment Guide

Инструкция по деплою CaféFlow на Vercel.

---

## 📋 Предварительные требования

1. ✅ Аккаунт на [Vercel](https://vercel.com)
2. ✅ База данных PostgreSQL (например, [Neon](https://neon.tech) или [Supabase](https://supabase.com))
3. ✅ Telegram бот создан через @BotFather
4. ✅ GitHub репозиторий с кодом

---

## 🗄️ Шаг 1: Настройка базы данных

### Вариант A: Neon (Рекомендуется)

1. Зарегистрируйтесь на [neon.tech](https://neon.tech)
2. Создайте новый проект
3. Скопируйте `DATABASE_URL` (Connection String)
4. Убедитесь что в строке есть `?sslmode=require`

**Пример:**
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Вариант B: Supabase

1. Зарегистрируйтесь на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Перейдите в Settings → Database
4. Скопируйте `Connection String` (URI, не Session)
5. Замените `[YOUR-PASSWORD]` на ваш пароль

**Пример:**
```
postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

---

## 📦 Шаг 2: Деплой на Vercel

### Через веб-интерфейс:

1. **Перейдите на [vercel.com](https://vercel.com)**

2. **Нажмите "Add New Project"**

3. **Импортируйте Git репозиторий:**
   - Выберите GitHub
   - Найдите репозиторий `CaféFlow`
   - Нажмите Import

4. **Configure Project:**
   - Framework Preset: **Next.js**
   - Root Directory: `.` (по умолчанию)
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

5. **Environment Variables** (нажмите "Add" для каждой):

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"

# JWT
JWT_SECRET="генерируйте-случайную-строку-32-символа"

# Telegram Bot
TELEGRAM_BOT_TOKEN="12345:ABCdefGHIjkl_MNOpqrsTUVwxyz"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="cafeflow_admin_bot"
TELEGRAM_WEBHOOK_SECRET="генерируйте-случайную-строку-32-символа"

# Admin
ADMIN_SETUP_TOKEN="генерируйте-случайную-строку-32-символа"

# App URL (заполните ПОСЛЕ первого деплоя)
NEXT_PUBLIC_APP_URL="https://your-project.vercel.app"
```

6. **Нажмите "Deploy"**

7. **Дождитесь успешного деплоя** (2-3 минуты)

---

## 🔄 Шаг 3: Миграция базы данных

После успешного деплоя нужно применить миграции:

### Вариант A: Локально (Рекомендуется)

```bash
# 1. Скопируйте DATABASE_URL из Vercel
export DATABASE_URL="postgresql://..."

# 2. Примените миграции
npx prisma migrate deploy

# 3. (Опционально) Заполните тестовыми данными
npx prisma db seed
```

### Вариант B: Через Vercel CLI

```bash
# 1. Установите Vercel CLI
npm i -g vercel

# 2. Залогиньтесь
vercel login

# 3. Линкуйте проект
vercel link

# 4. Примените миграции
vercel env pull .env.production
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

## 🤖 Шаг 4: Настройка Telegram Webhook

После деплоя нужно настроить webhook для бота:

### 1. Получите URL вашего приложения:
```
https://your-project.vercel.app
```

### 2. Обновите переменную окружения:

Перейдите в Vercel → Project Settings → Environment Variables

Найдите `NEXT_PUBLIC_APP_URL` и обновите:
```
https://your-project.vercel.app
```

**Redeploy** проект для применения изменений.

### 3. Установите webhook:

```bash
curl -X POST https://your-project.vercel.app/api/telegram/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_TOKEN" \
  -d '{"action":"set"}'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "message": "Webhook set successfully",
  "url": "https://your-project.vercel.app/api/telegram/webhook"
}
```

### 4. Проверьте статус:

```bash
curl https://your-project.vercel.app/api/telegram/setup \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_TOKEN"
```

---

## 👤 Шаг 5: Создание первого админа

### Вариант A: SQL запрос

Подключитесь к базе данных и выполните:

```sql
-- 1. Создайте пользователя
INSERT INTO users (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  role,
  status,
  two_fa_enabled
) VALUES (
  gen_random_uuid(),
  'admin@cafeflow.local',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU0J6fQqIxEm', -- "password123"
  'Admin',
  'User',
  'admin',
  'active',
  false
);

-- 2. (Опционально) Для тестирования без 2FA оставьте two_fa_enabled = false
-- Для продакшена измените пароль и включите 2FA после привязки Telegram
```

### Вариант B: Prisma Studio (Локально)

```bash
# 1. Установите DATABASE_URL
export DATABASE_URL="postgresql://..."

# 2. Откройте Prisma Studio
npx prisma studio

# 3. Создайте пользователя вручную через UI
```

---

## ✅ Шаг 6: Проверка деплоя

### 1. Проверьте главную страницу:
```
https://your-project.vercel.app
```

### 2. Проверьте API:
```bash
curl https://your-project.vercel.app/api/health
```

### 3. Проверьте Telegram бота:
Откройте бота в Telegram и отправьте `/start`

### 4. Попробуйте войти:
```
https://your-project.vercel.app/admin/login
```

---

## 🔧 Troubleshooting

### Ошибка: "Prisma Client not generated"

**Решение:**
```bash
# В Vercel → Project Settings → General → Build & Development Settings
Build Command: prisma generate && next build
```

### Ошибка: "DATABASE_URL is not defined"

**Решение:**
1. Проверьте Environment Variables в Vercel
2. Убедитесь что `DATABASE_URL` добавлен
3. Redeploy проект

### Ошибка: "Invalid connection string"

**Решение:**
- Убедитесь что в конце есть `?sslmode=require`
- Проверьте что пароль не содержит специальных символов (или URL encode их)
- Для Neon используйте **Pooled connection string**

### Ошибка: Telegram webhook не работает

**Решение:**
1. Проверьте что `NEXT_PUBLIC_APP_URL` установлен правильно
2. URL должен начинаться с `https://` (не `http://`)
3. Убедитесь что endpoint `/api/telegram/webhook` доступен
4. Проверьте `TELEGRAM_WEBHOOK_SECRET` совпадает

### Ошибка: Build fails с "bcrypt error"

**Решение:**
Vercel автоматически компилирует bcrypt для Linux. Если ошибка:
```bash
# Убедитесь что bcrypt установлен как dependency (не devDependency)
npm install --save bcrypt
```

---

## 📊 Мониторинг

### Vercel Analytics

1. Перейдите в Project → Analytics
2. Включите **Web Analytics**
3. Включите **Speed Insights**

### Логи

Просмотр логов в реальном времени:
```bash
vercel logs YOUR_PROJECT_NAME --follow
```

Или через веб-интерфейс:
Project → Deployments → Latest → Logs

---

## 🔄 Обновление приложения

### Автоматический деплой:

Vercel автоматически деплоит при push в `main` ветку GitHub.

```bash
git add .
git commit -m "Update application"
git push origin main
```

### Ручной деплой:

```bash
vercel --prod
```

---

## 🔐 Безопасность в Production

### ✅ Чек-лист:

- [ ] Измените все дефолтные пароли
- [ ] Используйте сильные JWT_SECRET (32+ символов)
- [ ] Включите 2FA для всех админов
- [ ] Используйте HTTPS (Vercel делает автоматически)
- [ ] Ограничьте доступ к базе данных (только Vercel IP)
- [ ] Регулярно обновляйте зависимости
- [ ] Настройте мониторинг и алерты
- [ ] Бэкапьте базу данных

---

## 📝 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://...?sslmode=require` |
| `JWT_SECRET` | ✅ | JWT signing key (32+ chars) | `your-random-32-char-secret` |
| `TELEGRAM_BOT_TOKEN` | ✅ | Bot token from @BotFather | `12345:ABC...` |
| `TELEGRAM_WEBHOOK_SECRET` | ✅ | Webhook security token | `random-32-chars` |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | ✅ | Bot username | `cafeflow_admin_bot` |
| `NEXT_PUBLIC_APP_URL` | ✅ | App URL (after first deploy) | `https://your-app.vercel.app` |
| `ADMIN_SETUP_TOKEN` | ✅ | Token for webhook setup API | `random-32-chars` |
| `NODE_ENV` | Auto | Environment (Vercel sets automatically) | `production` |

---

## 🎯 Следующие шаги

После успешного деплоя:

1. ✅ Создайте админа
2. ✅ Привяжите Telegram
3. ✅ Протестируйте 2FA
4. ✅ Настройте кастомный домен (Vercel → Domains)
5. ✅ Настройте мониторинг
6. ✅ Пригласите команду

---

## 🆘 Поддержка

**Документация:**
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

**Проблемы:**
- Vercel Support: support@vercel.com
- GitHub Issues: https://github.com/YOUR_REPO/issues

---

**Версия:** 1.0.0  
**Обновлено:** January 2026
