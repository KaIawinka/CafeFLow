# 🔐 Система подтверждения входа администратором

**Концепция:** Сотрудники не могут просто войти с паролем - каждый вход требует подтверждения администратором через Telegram бота.

---

## 🎯 КАК ЭТО РАБОТАЕТ

### Сценарий входа сотрудника:

```
1. Менеджер/Повар открывает админ-панель
   → Вводит email + пароль
   
2. Система проверяет данные
   ✅ Пароль верный
   ⏳ НО вход не выполнен!
   
3. Сотруднику показывается:
   "⏳ Ожидание подтверждения администратора..."
   
4. ВСЕМ администраторам приходит уведомление в Telegram:
   ┌─────────────────────────────────────┐
   │ 🔔 Запрос на вход                   │
   │                                     │
   │ 👤 Иван Петров                      │
   │ 🎭 Роль: Менеджер                   │
   │ 📧 ivan@cafeflow.com                │
   │ 📱 +996 555 123 456                 │
   │ 🕐 12:45, 12.09.2026                │
   │ 🌐 IP: 192.168.1.15                 │
   │ 💻 Chrome on Windows                │
   │                                     │
   │ [ ✅ Разрешить ]  [ ❌ Отклонить ]   │
   └─────────────────────────────────────┘
   
5. Администратор нажимает "Разрешить"
   
6. Сотрудник автоматически входит в систему! ✅
```

---

## 🏗️ АРХИТЕКТУРА РЕШЕНИЯ

### Компоненты:

```
┌──────────────┐
│   Сотрудник  │ Вводит email/пароль
└──────┬───────┘
       ↓
┌──────────────────────────────────────┐
│  POST /api/auth/request-access       │
│  1. Проверка пароля                  │
│  2. Создание pending_request         │
│  3. Отправка уведомления админам     │
└──────┬───────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│  Telegram Bot → Всем админам         │
│  Уведомление с кнопками              │
└──────┬───────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│  Админ нажимает "Разрешить"          │
│  Callback: approve_{request_id}      │
└──────┬───────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│  Bot обрабатывает callback:          │
│  1. Обновляет статус request         │
│  2. Создаёт сессию для сотрудника    │
│  3. Уведомляет сотрудника            │
└──────┬───────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│  Браузер сотрудника (polling):       │
│  GET /api/auth/check-approval        │
│  → Получает токен → Входит           │
└──────────────────────────────────────┘
```

---

## 📊 БАЗА ДАННЫХ

### Новая таблица: `access_requests`

```prisma
// prisma/schema.prisma

enum access_request_status {
  pending      // Ожидает подтверждения
  approved     // Одобрен
  rejected     // Отклонён
  expired      // Истёк (10 минут)
  cancelled    // Отменён сотрудником
}

model access_requests {
  id                String                @id @default(uuid()) @db.Uuid
  user_id           String                @db.Uuid
  request_token     String                @unique @db.VarChar(100)
  status            access_request_status @default(pending)
  
  // Информация о запросе
  ip_address        String?               @db.Inet
  user_agent        String?               @db.VarChar(500)
  device_info       Json?                 // Browser, OS, Device type
  location          String?               @db.VarChar(200)
  
  // Кто обработал
  approved_by       String?               @db.Uuid
  approved_at       DateTime?             @db.Timestamptz
  rejection_reason  String?               @db.VarChar(255)
  
  // Сессия после одобрения
  session_token     String?               @db.VarChar(500)
  
  // Timestamps
  expires_at        DateTime              @db.Timestamptz
  created_at        DateTime              @default(now()) @db.Timestamptz
  updated_at        DateTime              @updatedAt @db.Timestamptz

  user          users  @relation("access_requests", fields: [user_id], references: [id], onDelete: Cascade)
  approved_by_user users? @relation("approved_requests", fields: [approved_by], references: [id])

  @@index([user_id])
  @@index([request_token])
  @@index([status])
  @@index([expires_at])
  @@index([created_at])
}

// Обновляем модель users
model users {
  // ... existing fields ...
  
  // Новые связи
  access_requests      access_requests[] @relation("access_requests")
  approved_requests    access_requests[] @relation("approved_requests")
  
  // Настройка: требуется ли подтверждение для этого пользователя
  requires_approval    Boolean           @default(true)
}
```

---

## 💻 BACKEND РЕАЛИЗАЦИЯ

### 1. **API Endpoint: Запрос доступа**

```typescript
// src/app/api/auth/request-access/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { sendAccessRequestToAdmins } from '@/lib/telegram/notifications';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 1. Находим пользователя
    const user = await prisma.users.findFirst({
      where: { email, status: 'active' }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // 2. Проверяем пароль
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Пользователь не настроен' },
        { status: 400 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      // Логируем неудачную попытку
      await prisma.login_attempts.create({
        data: {
          email,
          ip_address: request.ip || '0.0.0.0',
          user_agent: request.headers.get('user-agent'),
          success: false,
          reason: 'Invalid password'
        }
      });

      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // 3. Проверяем, нужно ли подтверждение
    // Админы могут входить без подтверждения
    if (user.role === 'admin' || !user.requires_approval) {
      // Создаём сессию напрямую
      const { accessToken } = await generateTokenPair({
        userId: user.id,
        email: user.email!,
        role: user.role,
        tenantId: user.tenant_id || undefined
      });

      return NextResponse.json({
        requiresApproval: false,
        accessToken
      });
    }

    // 4. Создаём запрос на доступ
    const requestToken = crypto.randomUUID().replace(/-/g, '');
    
    const deviceInfo = parseUserAgent(request.headers.get('user-agent'));

    const accessRequest = await prisma.access_requests.create({
      data: {
        user_id: user.id,
        request_token: requestToken,
        status: 'pending',
        ip_address: request.ip,
        user_agent: request.headers.get('user-agent'),
        device_info: deviceInfo,
        expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 минут
      }
    });

    // 5. Отправляем уведомления всем администраторам
    await sendAccessRequestToAdmins(user, accessRequest);

    logger.info('Access request created', {
      userId: user.id,
      email: user.email,
      requestId: accessRequest.id
    });

    // 6. Возвращаем токен для polling
    return NextResponse.json({
      requiresApproval: true,
      requestToken,
      expiresIn: 600 // 10 минут в секундах
    });

  } catch (error) {
    logger.error('Request access error', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Парсинг User Agent
function parseUserAgent(userAgent: string | null) {
  if (!userAgent) return null;
  
  // Простой парсинг (можно использовать библиотеку ua-parser-js)
  const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
  const isTablet = /Tablet|iPad/i.test(userAgent);
  
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return {
    browser,
    os,
    deviceType: isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'
  };
}
```

### 2. **API Endpoint: Проверка одобрения (Polling)**

```typescript
// src/app/api/auth/check-approval/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const requestToken = request.nextUrl.searchParams.get('token');

  if (!requestToken) {
    return NextResponse.json(
      { error: 'Missing token' },
      { status: 400 }
    );
  }

  try {
    const accessRequest = await prisma.access_requests.findUnique({
      where: { request_token: requestToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            tenant_id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    if (!accessRequest) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
    }

    // Проверяем истёк ли токен
    if (accessRequest.expires_at < new Date()) {
      if (accessRequest.status === 'pending') {
        await prisma.access_requests.update({
          where: { id: accessRequest.id },
          data: { status: 'expired' }
        });
      }
      
      return NextResponse.json({
        status: 'expired',
        message: 'Запрос истёк. Попробуйте войти снова.'
      });
    }

    // Возвращаем статус
    switch (accessRequest.status) {
      case 'pending':
        return NextResponse.json({
          status: 'pending',
          message: 'Ожидание подтверждения администратора...',
          expiresAt: accessRequest.expires_at
        });

      case 'approved':
        // Возвращаем токен сессии
        return NextResponse.json({
          status: 'approved',
          accessToken: accessRequest.session_token,
          user: {
            email: accessRequest.user.email,
            role: accessRequest.user.role,
            name: `${accessRequest.user.first_name} ${accessRequest.user.last_name}`
          }
        });

      case 'rejected':
        return NextResponse.json({
          status: 'rejected',
          message: accessRequest.rejection_reason || 'Вход отклонён администратором',
        });

      default:
        return NextResponse.json({
          status: accessRequest.status,
          message: 'Неизвестный статус запроса'
        });
    }

  } catch (error) {
    logger.error('Check approval error', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка' },
      { status: 500 }
    );
  }
}
```

### 3. **API Endpoint: Одобрение/Отклонение (для бота)**

```typescript
// src/app/api/auth/process-approval/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTokenPair } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { requestId, action, adminUserId, reason } = await request.json();

    // Проверка прав (вызывается только из бота, дополнительная проверка)
    const admin = await prisma.users.findUnique({
      where: { id: adminUserId }
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Получаем запрос
    const accessRequest = await prisma.access_requests.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!accessRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (accessRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request already processed' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Одобряем запрос
      const { accessToken } = await generateTokenPair({
        userId: accessRequest.user.id,
        email: accessRequest.user.email!,
        role: accessRequest.user.role,
        tenantId: accessRequest.user.tenant_id || undefined
      });

      await prisma.access_requests.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          approved_by: adminUserId,
          approved_at: new Date(),
          session_token: accessToken
        }
      });

      logger.info('Access request approved', {
        requestId,
        userId: accessRequest.user_id,
        approvedBy: adminUserId
      });

      return NextResponse.json({
        success: true,
        message: 'Доступ разрешён'
      });

    } else if (action === 'reject') {
      // Отклоняем запрос
      await prisma.access_requests.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          approved_by: adminUserId,
          approved_at: new Date(),
          rejection_reason: reason || 'Отклонено администратором'
        }
      });

      logger.info('Access request rejected', {
        requestId,
        userId: accessRequest.user_id,
        rejectedBy: adminUserId,
        reason
      });

      return NextResponse.json({
        success: true,
        message: 'Доступ отклонён'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Process approval error', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка' },
      { status: 500 }
    );
  }
}
```

---

## 🤖 TELEGRAM BOT

### Отправка уведомлений администраторам

```typescript
// src/lib/telegram/notifications.ts

import { bot } from './bot';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function sendAccessRequestToAdmins(
  user: any,
  accessRequest: any
) {
  try {
    // Находим всех администраторов с привязанным Telegram
    const admins = await prisma.users.findMany({
      where: {
        role: 'admin',
        status: 'active',
        telegram_chat_id: { not: null }
      }
    });

    if (admins.length === 0) {
      logger.warn('No admins with Telegram found for access request');
      return;
    }

    // Формируем сообщение
    const message = formatAccessRequestMessage(user, accessRequest);

    // Отправляем каждому админу
    const sendPromises = admins.map(admin => 
      bot.api.sendMessage(
        admin.telegram_chat_id!,
        message,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Разрешить',
                  callback_data: `approve_${accessRequest.id}`
                },
                {
                  text: '❌ Отклонить',
                  callback_data: `reject_${accessRequest.id}`
                }
              ],
              [
                {
                  text: '📋 Детали',
                  callback_data: `details_${accessRequest.id}`
                }
              ]
            ]
          }
        }
      ).catch(error => {
        logger.error('Failed to send notification to admin', error, {
          adminId: admin.id,
          chatId: admin.telegram_chat_id
        });
      })
    );

    await Promise.allSettled(sendPromises);

    logger.info('Access request notifications sent', {
      requestId: accessRequest.id,
      adminCount: admins.length
    });

  } catch (error) {
    logger.error('Failed to send access request notifications', error);
  }
}

function formatAccessRequestMessage(user: any, accessRequest: any): string {
  const roleEmoji = {
    manager: '👔',
    kitchen: '👨‍🍳',
    employee: '👤',
    customer: '🙋'
  };

  const deviceInfo = accessRequest.device_info || {};
  const deviceEmoji = 
    deviceInfo.deviceType === 'Mobile' ? '📱' : 
    deviceInfo.deviceType === 'Tablet' ? '📱' : '💻';

  return `
🔔 <b>Запрос на вход в систему</b>

${roleEmoji[user.role] || '👤'} <b>${user.first_name} ${user.last_name || ''}</b>
🎭 Роль: <code>${getRoleLabel(user.role)}</code>
📧 Email: <code>${user.email}</code>
${user.phone ? `📱 Телефон: <code>${user.phone}</code>` : ''}

📍 <b>Информация о подключении:</b>
🕐 Время: ${formatDateTime(accessRequest.created_at)}
🌐 IP: <code>${accessRequest.ip_address || 'N/A'}</code>
${deviceEmoji} Устройство: ${deviceInfo.browser || 'Unknown'} on ${deviceInfo.os || 'Unknown'}

⏱ Запрос истекает через 10 минут
  `.trim();
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Администратор',
    manager: 'Менеджер',
    kitchen: 'Кухня',
    employee: 'Сотрудник',
    customer: 'Клиент'
  };
  return labels[role] || role;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
```

### Обработка callback от кнопок

```typescript
// src/lib/telegram/handlers/approvals.ts

import { BotContext } from '../bot';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function handleApprovalCallback(ctx: BotContext) {
  const callbackData = ctx.callbackQuery?.data;
  
  if (!callbackData) return;

  const [action, requestId] = callbackData.split('_');

  try {
    const accessRequest = await prisma.access_requests.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            role: true
          }
        }
      }
    });

    if (!accessRequest) {
      await ctx.answerCallbackQuery('❌ Запрос не найден');
      return;
    }

    if (accessRequest.status !== 'pending') {
      await ctx.answerCallbackQuery('⚠️ Запрос уже обработан');
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      return;
    }

    if (action === 'approve') {
      // Одобряем через API
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/process-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action: 'approve',
          adminUserId: ctx.user!.id
        })
      });

      await ctx.editMessageText(
        ctx.callbackQuery.message?.text + '\n\n' +
        `✅ <b>РАЗРЕШЕНО</b>\n` +
        `👤 Администратор: ${ctx.user!.first_name}`,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [] }
        }
      );

      await ctx.answerCallbackQuery('✅ Доступ разрешён');

      logger.info('Access request approved via Telegram', {
        requestId,
        approvedBy: ctx.user!.id
      });

    } else if (action === 'reject') {
      // Спрашиваем причину (упрощённый вариант)
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/process-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action: 'reject',
          adminUserId: ctx.user!.id,
          reason: 'Отклонено администратором'
        })
      });

      await ctx.editMessageText(
        ctx.callbackQuery.message?.text + '\n\n' +
        `❌ <b>ОТКЛОНЕНО</b>\n` +
        `👤 Администратор: ${ctx.user!.first_name}`,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [] }
        }
      );

      await ctx.answerCallbackQuery('❌ Доступ отклонён');

      logger.info('Access request rejected via Telegram', {
        requestId,
        rejectedBy: ctx.user!.id
      });

    } else if (action === 'details') {
      // Показываем детали
      const details = `
📋 <b>Детальная информация</b>

👤 <b>Пользователь:</b>
• ID: <code>${accessRequest.user.id}</code>
• Email: <code>${accessRequest.user.email}</code>
• Роль: ${getRoleLabel(accessRequest.user.role)}

🌐 <b>Подключение:</b>
• IP: <code>${accessRequest.ip_address}</code>
• User Agent: <code>${accessRequest.user_agent?.substring(0, 100)}...</code>

🕐 <b>Время:</b>
• Создан: ${formatDateTime(accessRequest.created_at)}
• Истекает: ${formatDateTime(accessRequest.expires_at)}
      `.trim();

      await ctx.answerCallbackQuery();
      await ctx.reply(details, { parse_mode: 'HTML' });
    }

  } catch (error) {
    logger.error('Error handling approval callback', error);
    await ctx.answerCallbackQuery('❌ Произошла ошибка');
  }
}

// Регистрируем обработчики
bot.on('callback_query:data', async (ctx: BotContext, next) => {
  const data = ctx.callbackQuery.data;
  
  if (data.startsWith('approve_') || data.startsWith('reject_') || data.startsWith('details_')) {
    await handleApprovalCallback(ctx);
    return;
  }
  
  await next();
});
```

---

## 🎨 FRONTEND (Login Page)

```typescript
// src/app/[locale]/admin/login/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [requestToken, setRequestToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Polling для проверки одобрения
  useEffect(() => {
    if (!requestToken || !waiting) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/auth/check-approval?token=${requestToken}`
        );
        const data = await response.json();

        if (data.status === 'approved') {
          clearInterval(interval);
          // Сохраняем токен
          localStorage.setItem('accessToken', data.accessToken);
          // Перенаправляем в админку
          router.push('/admin/dashboard');
        } else if (data.status === 'rejected') {
          clearInterval(interval);
          setWaiting(false);
          setError(data.message);
        } else if (data.status === 'expired') {
          clearInterval(interval);
          setWaiting(false);
          setError('Время ожидания истекло. Попробуйте снова.');
        } else {
          setMessage(data.message);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000); // Проверяем каждые 2 секунды

    return () => clearInterval(interval);
  }, [requestToken, waiting, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      if (data.requiresApproval) {
        // Требуется подтверждение
        setRequestToken(data.requestToken);
        setWaiting(true);
        setMessage('Ожидание подтверждения администратора...');
      } else {
        // Вход без подтверждения (админ)
        localStorage.setItem('accessToken', data.accessToken);
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          Вход в админ-панель
        </h1>

        {!waiting ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Проверка...' : 'Войти'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2">
              Ожидание подтверждения
            </h2>
            
            <p className="text-gray-600 mb-4">
              {message}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                💡 Уведомление отправлено всем администраторам в Telegram.
                Дождитесь подтверждения для входа в систему.
              </p>
            </div>

            <button
              onClick={() => {
                setWaiting(false);
                setRequestToken(null);
                setMessage('');
              }}
              className="text-blue-600 hover:underline"
            >
              Отменить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 📝 МИГРАЦИЯ БАЗЫ ДАННЫХ

```bash
# Создание миграции
npx prisma migrate dev --name add_access_requests
```

```sql
-- Миграция будет создана автоматически из schema.prisma
-- Но вот SQL для ручного добавления:

-- 1. Enum для статусов
CREATE TYPE access_request_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired',
  'cancelled'
);

-- 2. Таблица запросов
CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_token VARCHAR(100) UNIQUE NOT NULL,
  status access_request_status DEFAULT 'pending',
  
  ip_address INET,
  user_agent VARCHAR(500),
  device_info JSONB,
  location VARCHAR(200),
  
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason VARCHAR(255),
  
  session_token VARCHAR(500),
  
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Индексы
CREATE INDEX idx_access_requests_user_id ON access_requests(user_id);
CREATE INDEX idx_access_requests_token ON access_requests(request_token);
CREATE INDEX idx_access_requests_status ON access_requests(status);
CREATE INDEX idx_access_requests_expires ON access_requests(expires_at);
CREATE INDEX idx_access_requests_created ON access_requests(created_at);

-- 4. Добавляем поле в users
ALTER TABLE users ADD COLUMN requires_approval BOOLEAN DEFAULT true;

-- 5. Устанавливаем requires_approval = false для админов
UPDATE users SET requires_approval = false WHERE role = 'admin';
```

---

## ✅ ЧЕКЛИСТ РЕАЛИЗАЦИИ

### Этап 1: База данных (30 минут)
- [ ] Добавить enum `access_request_status`
- [ ] Создать таблицу `access_requests`
- [ ] Добавить поле `requires_approval` в `users`
- [ ] Применить миграцию

### Этап 2: Backend API (2-3 часа)
- [ ] `/api/auth/request-access` - запрос доступа
- [ ] `/api/auth/check-approval` - polling
- [ ] `/api/auth/process-approval` - одобрение/отклонение
- [ ] Парсинг User Agent
- [ ] Логирование

### Этап 3: Telegram Bot (1-2 часа)
- [ ] Функция `sendAccessRequestToAdmins`
- [ ] Форматирование сообщения
- [ ] Обработчик callback `approve_*`
- [ ] Обработчик callback `reject_*`
- [ ] Обработчик callback `details_*`

### Этап 4: Frontend (2-3 часа)
- [ ] Форма входа
- [ ] Состояние "Ожидание подтверждения"
- [ ] Polling механизм
- [ ] Обработка ошибок
- [ ] Анимация загрузки

### Этап 5: Тестирование (1-2 часа)
- [ ] Тест успешного одобрения
- [ ] Тест отклонения
- [ ] Тест истечения времени
- [ ] Тест для админа (без подтверждения)
- [ ] Тест неверного пароля

---

## 🎯 ИТОГО

**Время разработки:** 1-2 дня  
**Сложность:** Средняя  
**Приоритет:** Высокий (безопасность!)

### Преимущества системы:
✅ Полный контроль администраторов  
✅ Защита от несанкционированного доступа  
✅ Лог всех попыток входа  
✅ Удобные уведомления в Telegram  
✅ Простой UX для сотрудников  

### Дополнительные улучшения (опционально):
- 📱 Push-уведомления администраторам
- 📊 Dashboard с историей запросов
- ⏰ Автоматическое одобрение в рабочие часы
- 🔔 Напоминание админам если долго не отвечают
- 📍 Geo-location проверка

---

**Готовы начать реализацию?** 🚀
