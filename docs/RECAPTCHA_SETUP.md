# Настройка Google reCAPTCHA v3

CafeFlow использует Google reCAPTCHA v3 для защиты от ботов и автоматизированных атак на формы регистрации и входа.

## Что такое reCAPTCHA v3?

reCAPTCHA v3 работает невидимо для пользователей — без checkbox'ов и головоломок. Она анализирует поведение пользователя и присваивает каждому действию оценку (score) от 0.0 до 1.0:
- **1.0** — очень вероятно настоящий пользователь
- **0.0** — очень вероятно бот

CafeFlow использует минимальный порог **0.5** для разрешения регистрации и входа.

## Получение ключей reCAPTCHA

### Шаг 1: Создание сайта в Google reCAPTCHA

1. Откройте [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Войдите под своим Google аккаунтом
3. Нажмите кнопку **"+"** (Создать)

### Шаг 2: Настройка сайта

Заполните форму:

- **Название**: `CafeFlow` (или любое другое)
- **Тип reCAPTCHA**: Выберите **reCAPTCHA v3**
- **Домены**: Добавьте ваши домены:
  ```
  localhost          (для разработки)
  yourdomain.com     (ваш production домен)
  vercel.app         (если деплоите на Vercel)
  ```
- **Владельцы**: Ваш email (автоматически)
- **Принять условия**: ✅ Отметьте галочку
- Нажмите **"Отправить"**

### Шаг 3: Получение ключей

После создания вы получите два ключа:

1. **Site Key** (Ключ сайта) — публичный ключ для фронтенда
   ```
   Пример: 6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

2. **Secret Key** (Секретный ключ) — приватный ключ для бэкенда
   ```
   Пример: 6LcYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
   ```

## Настройка переменных окружения

Добавьте ключи в файл `.env`:

```bash
# reCAPTCHA v3
RECAPTCHA_SECRET_KEY="6LcYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY"
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

⚠️ **Важно**:
- `RECAPTCHA_SECRET_KEY` — **секретный**, никогда не публикуйте его
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` — публичный, используется в браузере
- Префикс `NEXT_PUBLIC_` обязателен для переменных, используемых в клиенте

## Проверка работы

### Разработка (Development)

Если переменные не настроены в development режиме:
- ⚠️ reCAPTCHA будет **пропущена** с предупреждением в логах
- Регистрация и вход будут работать **без проверки**
- Это сделано для удобства локальной разработки

### Production

В production режиме reCAPTCHA **обязательна**:
- ❌ Если ключи не настроены, регистрация и вход будут заблокированы
- ✅ Все запросы проверяются через Google API
- 📊 Логи содержат score каждой проверки

## Где используется reCAPTCHA

### 1. Регистрация (`/register`)
- Проверяется при отправке формы регистрации
- Action: `'register'`
- Минимальный score: **0.5**

### 2. Вход (`/login`)
- Проверяется при отправке формы входа
- Action: `'login'`
- Минимальный score: **0.5**

## Настройка score порога

Текущий минимальный score: **0.5**

Если вы хотите изменить порог, отредактируйте файл `src/lib/recaptcha.ts`:

```typescript
const MIN_SCORE = 0.5; // Измените значение (0.0 - 1.0)
```

### Рекомендации по score:

- **0.3** — Либеральный (пропускает больше пользователей, но и ботов)
- **0.5** — Сбалансированный (рекомендуется) ✅
- **0.7** — Строгий (блокирует больше ботов, но может задеть реальных пользователей)

## Мониторинг и аналитика

### Просмотр статистики в Google Console

1. Откройте [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Выберите ваш сайт
3. Перейдите на вкладку **"Аналитика"**

Здесь вы увидите:
- 📊 Количество проверок
- 📈 Распределение score
- 🤖 Обнаруженные подозрительные действия
- 📉 Процент блокировок

### Просмотр логов в приложении

Логи reCAPTCHA записываются в консоль/файл:

```typescript
// Успешная проверка
logger.info('reCAPTCHA verification successful', { score: 0.9, action: 'register' });

// Низкий score
logger.warn('reCAPTCHA score too low', { score: 0.2, minScore: 0.5, action: 'login' });

// Ошибка проверки
logger.error('reCAPTCHA verification error', error);
```

## Troubleshooting

### Проблема: "reCAPTCHA not configured"

**Причина**: Отсутствуют переменные окружения

**Решение**:
1. Убедитесь, что `.env` содержит оба ключа
2. Перезапустите dev сервер: `npm run dev`
3. Проверьте, что ключи не содержат лишних пробелов

### Проблема: "reCAPTCHA verification failed"

**Причины**:
- ❌ Неверный секретный ключ
- ❌ Домен не добавлен в Google Console
- ❌ Истёк срок действия токена (2 минуты)

**Решение**:
1. Проверьте правильность `RECAPTCHA_SECRET_KEY`
2. Добавьте текущий домен в Google Console
3. Попробуйте снова (токен обновится)

### Проблема: "reCAPTCHA score too low"

**Причина**: Score пользователя ниже 0.5

**Что делать**:
1. Проверьте логи — возможно, это реально подозрительная активность
2. Если score близок к порогу (0.4-0.49), можно снизить `MIN_SCORE`
3. Попросите пользователя попробовать с другого браузера/устройства

### Проблема: Работает локально, но не работает на production

**Причины**:
- ❌ Домен не добавлен в Google Console
- ❌ Переменные не настроены в Vercel/hosting

**Решение Vercel**:
1. Project Settings → Environment Variables
2. Добавьте обе переменные:
   - `RECAPTCHA_SECRET_KEY`
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
3. Redeploy проект

## Безопасность

### Защита секретного ключа

✅ **Правильно**:
- Хранить в `.env` (не коммитить!)
- Использовать environment variables в hosting
- Передавать через Vercel/hosting настройки

❌ **Неправильно**:
- Коммитить в Git
- Хранить в client-side коде
- Передавать через URL параметры

### Rate Limiting

reCAPTCHA защищает от:
- 🤖 Ботов
- 🔄 Автоматизированных скриптов
- 💥 Brute-force атак

Но также используйте:
- Rate limiting на API уровне (уже реализовано для email)
- IP блокировку после множественных неудач
- CAPTCHA только для подозрительного поведения

## Альтернативы

Если Google reCAPTCHA не подходит:

1. **hCaptcha** — похож на reCAPTCHA, но больше privacy
2. **Cloudflare Turnstile** — невидимая альтернатива
3. **FriendlyCaptcha** — не использует Google

Для интеграции потребуется изменить `src/lib/recaptcha.ts` и компоненты.

## Дополнительные ресурсы

- [Google reCAPTCHA Docs](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [Best Practices](https://developers.google.com/recaptcha/docs/faq)

---

**Последнее обновление**: 2024
**Версия документа**: 1.0
