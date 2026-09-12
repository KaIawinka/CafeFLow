# 🚀 Vercel Quick Start

## ✅ Что уже сделано:

1. ✅ Prisma настроен правильно (generator: prisma-client-js)
2. ✅ Build скрипты обновлены (postinstall + build)
3. ✅ vercel.json настроен
4. ✅ Все изменения запушены в GitHub

---

## 📋 Следующие шаги:

### 1. Добавьте переменные окружения в Vercel

**Перейдите:** Vercel → Ваш проект → Settings → Environment Variables

**Добавьте каждую переменную (выберите все 3: Production, Preview, Development):**

```bash
DATABASE_URL
postgresql://user:password@host:5432/db?sslmode=require

JWT_SECRET
ваша-случайная-строка-минимум-32-символа

TELEGRAM_BOT_TOKEN
ваш-токен-от-botfather

NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
имя_вашего_бота

TELEGRAM_WEBHOOK_SECRET
случайная-строка-32-символа

ADMIN_SETUP_TOKEN
еще-одна-случайная-строка

NEXT_PUBLIC_APP_URL
https://ваш-проект.vercel.app
```

### 2. Генерация случайных строк

```bash
# Online
https://www.random.org/strings/

# Командная строка
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. После добавления переменных

Нажмите **Redeploy** в Vercel или:

```bash
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

### 4. База данных

**Рекомендуем Neon (бесплатно):**
1. https://neon.tech → Sign up
2. Create New Project
3. Copy Connection String
4. Используйте как DATABASE_URL

**Применить миграции после деплоя:**
```bash
export DATABASE_URL="ваш-database-url"
npx prisma migrate deploy
```

---

## 🎯 Ожидаемый результат:

После добавления переменных и redeploy:

```
✅ Installing dependencies
✅ Running postinstall: prisma generate  
✅ Generated Prisma Client to node_modules/@prisma/client
✅ Running build: prisma generate && next build
✅ Build completed successfully
✅ Deploying...
✅ Deployment ready!
```

---

## 📚 Полная документация:

`docs/VERCEL_DEPLOYMENT.md`

---

**Текущий статус:** Готов к деплою, нужны только переменные окружения! ✅
