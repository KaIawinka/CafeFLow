# 🤖 Telegram Bot Setup Guide

Полная инструкция по настройке Telegram бота для 2FA.

---

## 📋 Шаг 1: Создание бота через BotFather

### 1. Откройте Telegram и найдите @BotFather

### 2. Создайте нового бота:

```
/newbot
```

### 3. Введите имя бота:
```
CaféFlow Admin Bot
```

### 4. Введите username (должен заканчиваться на bot):
```
cafeflow_admin_bot
```

### 5. BotFather пришлёт вам:
```
Done! Congratulations on your new bot.
You will find it at t.me/cafeflow_admin_bot.
You can now add a description...

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567

For a description of the Bot API, see this page:
https://core.telegram.org/bots/api
```

**Сохраните этот токен!** Он нужен для .env файла.

---

## 🔧 Шаг 2: Настройка бота

### 1. Установите описание:

```
/setdescription
@cafeflow_admin_bot
```

Текст описания:
```
Бот для двухфакторной аутентификации в CaféFlow Admin Panel.

Отправляет коды для входа в систему управления рестораном.

Безопасно. Коды действуют 5 минут.
```

### 2. Установите короткое описание:

```
/setabouttext
@cafeflow_admin_bot
```

Текст:
```
Бот 2FA для CaféFlow Admin
```

### 3. Установите команды:

```
/setcommands
@cafeflow_admin_bot
```

Список команд:
```
start - Привязать аккаунт
activate - Активировать аккаунт по ключу
login - Получить ссылку для входа
status - Проверить статус привязки
admin - Команды администратора
help - Справка по командам
```

### 4. Отключите группы (бот только для личных чатов):

```
/setjoingroups
@cafeflow_admin_bot
```

Выберите: `Disable`

### 5. (Опционально) Установите аватар:

```
/setuserpic
@cafeflow_admin_bot
```

Отправьте квадратное изображение (рекомендуется 512x512px) с логотипом CaféFlow.

---

## ⚙️ Шаг 3: Настройка переменных окружения

### Обновите `.env` файл:

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567"
TELEGRAM_WEBHOOK_SECRET="your-random-secret-string-here"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="cafeflow_admin_bot"

# App URL (для webhook)
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Admin setup token (для безопасности)
ADMIN_SETUP_TOKEN="another-random-secret-string"
```

### Генерация секретов:

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Online
# https://www.random.org/strings/
```

---

## 🚀 Шаг 4: Запуск и настройка webhook

Перед установкой webhook настройте меню и описание бота:

```bash
npm run telegram:commands
```

Для создания первого администратора задайте значения только в текущем терминале и выполните:

```bash
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="strong-password" ADMIN_FIRST_NAME="Admin" ADMIN_TELEGRAM_CHAT_ID="123456789" npm run admin:create
```

Пароль и chat ID не храните в исходном коде. Администратор должен иметь привязанный Telegram, потому что вход в admin-панель подтверждается кодом из бота.

### Development (Local):

```bash
# 1. Запустите ngrok для публичного URL
ngrok http 3000

# 2. Скопируйте URL (например: https://abc123.ngrok.io)

# 3. Установите webhook
curl -X POST http://localhost:3000/api/telegram/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_TOKEN" \
  -d '{"action":"set","url":"https://abc123.ngrok.io/api/telegram/webhook"}'

# 4. Проверьте статус
curl http://localhost:3000/api/telegram/setup \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_TOKEN"
```

### Production:

```bash
# После деплоя автоматически установите webhook
curl -X POST https://your-domain.com/api/telegram/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_TOKEN" \
  -d '{"action":"set"}'

# Проверьте статус
curl https://your-domain.com/api/telegram/setup \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_TOKEN"
```

Для локальной разработки URL webhook должен быть публичным HTTPS-адресом ngrok. `http://localhost:3000` Telegram использовать не может.

**Ответ должен быть:**
```json
{
  "success": true,
  "message": "Webhook set successfully",
  "url": "https://your-domain.com/api/telegram/webhook"
}
```

---

## 🧪 Шаг 5: Тестирование бота

### 1. Найдите бота в Telegram:

Перейдите по ссылке: `https://t.me/cafeflow_admin_bot`

### 2. Нажмите START

Бот должен ответить приветствием:
```
👋 Привет, [Ваше имя]!

Я бот CaféFlow для двухфакторной аутентификации.
...
```

### 3. Проверьте команды:

```
/status
```

Должен ответить:
```
❌ Аккаунт не привязан

Этот Telegram не связан ни с одним аккаунтом CaféFlow.
...
```

```
/help
```

Должен показать справку по командам.

---

## 🔗 Шаг 6: Привязка первого админа

### Через CLI (будет создано позже):

```bash
npm run create-admin

# Следуйте инструкциям:
# 1. Email: admin@cafeflow.local
# 2. Password: ********
# 3. Name: Admin
# 
# Получите ссылку:
# https://t.me/cafeflow_admin_bot?start=abc123xyz...
```

### Вручную (если CLI ещё нет):

```sql
-- 1. Создайте админа в БД
INSERT INTO users (id, email, password_hash, first_name, role, status, two_fa_enabled)
VALUES (
  gen_random_uuid(),
  'admin@cafeflow.local',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU0J6fQqIxEm', -- "password123"
  'Admin',
  'admin',
  'active',
  true
) RETURNING id;

-- 2. Создайте link code
INSERT INTO telegram_link_codes (user_id, code, expires_at)
VALUES (
  'USER_ID_FROM_STEP_1',
  'RANDOM_CODE_HERE', -- сгенерируйте случайный код
  NOW() + INTERVAL '10 minutes'
);

-- 3. Перейдите по ссылке:
-- https://t.me/cafeflow_admin_bot?start=RANDOM_CODE_HERE
```

### Проверьте привязку:

В Telegram:
```
/status
```

Должен показать:
```
✅ Аккаунт привязан

👑 Admin
📧 admin@cafeflow.local
🎭 Роль: admin
🔐 2FA: Включен ✅
...
```

---

## 📊 Мониторинг и логи

### Проверка статуса бота:

```bash
# Получить информацию о боте и webhook
curl https://your-domain.com/api/telegram/setup \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_TOKEN"
```

**Ответ:**
```json
{
  "bot": {
    "username": "cafeflow_admin_bot",
    "id": 1234567890
  },
  "webhook": {
    "url": "https://your-domain.com/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": null,
    "last_error_message": null,
    "max_connections": 40
  },
  "env": {
    "app_url": "https://your-domain.com",
    "has_webhook_secret": true,
    "has_bot_token": true
  }
}
```

### Проверка логов:

```bash
# Next.js логи
npm run dev

# Production логи (Vercel)
vercel logs

# Docker logs
docker logs cafeflow-app
```

**Ищите:**
- `✅ Telegram handlers initialized` - обработчики загружены
- `✅ Webhook set to: ...` - webhook установлен
- `🤖 Starting bot...` - бот запущен

---

## 🔍 Troubleshooting

### Проблема: Бот не отвечает

**Решение:**
1. Проверьте что webhook установлен:
   ```bash
   curl https://your-domain.com/api/telegram/setup -H "Authorization: Bearer TOKEN"
   ```

2. Проверьте что URL доступен извне:
   ```bash
   curl https://your-domain.com/api/telegram/webhook
   ```

3. Проверьте логи Next.js на ошибки

### Проблема: Ошибка "Unauthorized" при установке webhook

**Решение:**
- Убедитесь что `ADMIN_SETUP_TOKEN` в `.env` совпадает с тем, что вы передаёте в header

### Проблема: Webhook отваливается

**Решение:**
1. Telegram требует HTTPS для webhook в production
2. Убедитесь что сервер доступен 24/7
3. Убедитесь что endpoint `/api/telegram/webhook` отвечает быстро (< 5 сек)

### Проблема: Коды не отправляются

**Решение:**
1. Проверьте что у пользователя привязан `telegram_chat_id`:
   ```sql
   SELECT telegram_chat_id, two_fa_enabled FROM users WHERE email = 'admin@cafeflow.local';
   ```

2. Проверьте функцию отправки:
   ```typescript
   import { sendVerificationCode } from '@/lib/telegram/messages';
   await sendVerificationCode(userId, '123456', 3);
   ```

3. Проверьте логи на ошибки Telegram API

### Проблема: "Bad Request: message text is empty"

**Решение:**
- Проверьте что все переменные в шаблонах сообщений определены
- Проверьте что код не пустой

---

## 🔒 Безопасность

### Best Practices:

✅ **Используйте webhook secret**
- Проверяйте `x-telegram-bot-api-secret-token` header
- Случайная строка 32+ символов

✅ **Только HTTPS в production**
- Telegram не отправит данные на HTTP

✅ **Rate limiting**
- Ограничьте количество кодов в единицу времени
- Ограничьте попытки привязки

✅ **Логирование**
- Логируйте все попытки привязки
- Логируйте ошибки отправки кодов

✅ **Мониторинг**
- Отслеживайте успешность доставки
- Алерты при проблемах с ботом

---

## 📝 Полезные ссылки

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Grammy Documentation](https://grammy.dev/)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)
- [Webhook Guide](https://core.telegram.org/bots/webhooks)

---

## ✅ Checklist готовности

- [ ] Бот создан через @BotFather
- [ ] Токен добавлен в `.env`
- [ ] Username бота добавлен в `.env`
- [ ] Webhook secret сгенерирован
- [ ] Admin setup token сгенерирован
- [ ] Описание и команды настроены
- [ ] Webhook установлен и работает
- [ ] Бот отвечает на `/start`
- [ ] Бот отвечает на `/status`
- [ ] Бот отвечает на `/help`
- [ ] Тестовая привязка аккаунта работает
- [ ] Коды доставляются в Telegram
- [ ] Логи проверены, ошибок нет

---

**Статус:** ✅ Готов к использованию
**Версия:** 1.0.0
