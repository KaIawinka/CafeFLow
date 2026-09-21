# CaféFlow

Система автоматизации для кафе и ресторанов с веб-админкой, Telegram-ботом и двухфакторной аутентификацией.

## 🚀 Технологии

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Prisma 7** - ORM with Neon adapter
- **Neon PostgreSQL** - Serverless database
- **Grammy** - Telegram bot framework
- **Jose** - JWT authentication
- **bcrypt** - Password hashing
- **Tailwind CSS 4** - Styling

## 📦 Установка

### 1. Clone репозиторий

```bash
git clone https://github.com/your-username/cafeflow.git
cd cafeflow
```

### 2. Установите зависимости

```bash
npm install
```

### 3. Настройте переменные окружения

Создайте файл `.env` в корне проекта. В репозитории шаблон `.env.example` не хранится, чтобы секреты не попадали в Git:

```bash
touch .env
```

Заполните переменные:

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require"

# JWT Secret (generate: openssl rand -base64 32)
JWT_SECRET="your-generated-secret"

# Telegram Bot (@BotFather)
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
# Username бота из BotFather, без символа @
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="your_cafeflow_bot"

# Webhook Secret (generate: openssl rand -base64 32)
TELEGRAM_WEBHOOK_SECRET="your-webhook-secret"

# Admin Token (generate: openssl rand -base64 32)
ADMIN_SETUP_TOKEN="your-admin-token"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Resend: бесплатный API key из resend.com
RESEND_API_KEY="re_your_api_key"
# Для теста без своего домена эту строку можно не указывать:
# приложение использует CaféFlow <onboarding@resend.dev>
# и Resend разрешает отправку только на email владельца Resend-аккаунта.
# Для отправки другим пользователям нужен подтверждённый домен:
# EMAIL_FROM="CaféFlow <noreply@your-domain.com>"

# Public tenant used when requests do not include ?tenant=slug or x-cafeflow-tenant
CAFEFLOW_DEFAULT_TENANT_SLUG="cafeflow-demo"

# Required for the scheduled technical cleanup endpoint
CRON_SECRET="your-random-cron-secret"

# Shared HMAC secret for payment provider webhooks
PAYMENT_WEBHOOK_SECRET="your-random-payment-webhook-secret"
```

### 4. Примените миграции базы данных

```bash
npx prisma migrate deploy
```

### 5. Сгенерируйте Prisma Client

```bash
npx prisma generate
```

## 🏃 Запуск

### Development

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:3000`

### Production

```bash
npm run build
npm start
```

## 📚 Структура проекта

```
src/
├── app/
│   ├── api/
│   │   ├── auth/         # Auth endpoints (login, 2FA, session, logout)
│   │   └── telegram/     # Telegram bot webhook & setup
│   ├── [locale]/         # Multi-language pages
│   └── i18n/            # Internationalization
├── components/          # React components
└── lib/
    ├── auth/            # JWT & password utilities
    ├── telegram/        # Bot handlers & messages
    ├── logger.ts        # Centralized logging
    └── prisma.ts        # Database client
```

## 🔐 Аутентификация

### Создание первого админа

Выполните SQL в Neon Console:

```sql
INSERT INTO users (
  id, email, password_hash, first_name, role, status, 
  two_fa_enabled, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'admin@cafeflow.com',
  '$2b$10$YourHashedPasswordHere',  -- Use bcrypt to generate
  'Admin',
  'admin',
  'active',
  false,
  NOW(),
  NOW()
);
```

Или используйте bcrypt CLI:

```bash
npx bcrypt-cli hash "your-password" 10
```

### API Endpoints

#### POST /api/auth/login
Первый шаг входа - проверка email/password

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

#### POST /api/auth/verify-2fa
Второй шаг - проверка 2FA кода

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

#### GET /api/auth/session
Проверка текущей сессии (требует JWT)

Headers: `Authorization: Bearer <token>`

#### POST /api/auth/logout
Выход из системы

## 🤖 Telegram Bot

### Настройка бота

1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите токен
3. Добавьте токен в `.env`
4. Настройте webhook:

```bash
curl -X POST https://your-domain.vercel.app/api/telegram/setup \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"set"}'
```

### Команды бота

- `/start` - Привязка аккаунта
- `/status` - Статус привязки
- `/help` - Справка

### Привязка Telegram

1. Войдите в аккаунт и откройте «Настройки» → «Безопасность».
2. Нажмите «Подключить Telegram».
3. Откройте одноразовую ссылку и нажмите START в боте.
4. Вернитесь в настройки и нажмите «Проверить подключение».

После привязки 2FA включается автоматически. Вход по email и паролю запрашивает шестизначный код из Telegram. Отключить 2FA можно там же после подтверждения текущего пароля; Telegram при этом остаётся привязанным для повторного включения.

Если доступ к Telegram потерян, на экране ввода 2FA откройте ссылку восстановления. После подтверждения ранее верифицированного email и смены пароля система отключит 2FA, отвяжет старый Telegram и завершит все активные сессии.

### Webhook

`TELEGRAM_BOT_TOKEN` сам по себе не принимает входящие сообщения. Для production задайте публичный `NEXT_PUBLIC_APP_URL` по HTTPS, `TELEGRAM_WEBHOOK_SECRET` и `ADMIN_SETUP_TOKEN`, затем после деплоя выполните:

```bash
curl -X POST https://your-domain.vercel.app/api/telegram/setup \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"set"}'
```

Для локальной проверки используйте HTTPS-туннель (например, ngrok) и передайте его URL в `url` запроса setup. `http://localhost:3000` Telegram недоступен.

## 🚢 Деплой на Vercel

### 1. Push в GitHub

```bash
git push origin main
```

### 2. Импортируйте проект в Vercel

1. Зайдите на [vercel.com](https://vercel.com)
2. Import Git Repository
3. Выберите ваш репозиторий

### 3. Добавьте переменные окружения

В Vercel → Settings → Environment Variables добавьте:

- `DATABASE_URL`
- `JWT_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `ADMIN_SETUP_TOKEN`
- `CRON_SECRET`
- `PAYMENT_WEBHOOK_SECRET`

### 4. Deploy!

Vercel автоматически задеплоит проект.

### 5. Настройте webhook

После первого деплоя:

```bash
curl -X POST https://your-project.vercel.app/api/telegram/setup \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"set"}'
```

## 🔧 Разработка

### Prisma Studio

Просмотр базы данных:

```bash
npx prisma studio
```

### Миграции

Создать новую миграцию:

```bash
npx prisma migrate dev --name migration_name
```

### Логирование

Используется централизованный logger (`src/lib/logger.ts`):

```typescript
import { logger } from '@/lib/logger';

logger.info('Message', { context: 'data' });
logger.warn('Warning', { userId: '123' });
logger.error('Error occurred', error, { context: 'data' });
logger.debug('Debug info'); // Only in development
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📞 Support

- Email: support@cafeflow.com
- Telegram: @cafeflow_support
