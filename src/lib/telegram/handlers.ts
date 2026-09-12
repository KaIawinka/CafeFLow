/**
 * Telegram Bot Command Handlers
 * Handles /start, /activate, /login, /status, /help commands
 */

import { bot, type BotContext } from './bot';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { verifyPassword } from '@/lib/auth/password';

// User state management (in-memory for simplicity)
interface UserState {
  awaitingKey?: boolean;
  awaitingEmail?: boolean;
  awaitingPassword?: boolean;
  keyValidated?: {
    keyId: string;
    keyType: string;
  };
  email?: string;
}

const userStates = new Map<string, UserState>();

/**
 * Get or create user state
 */
function getUserState(chatId: string): UserState {
  if (!userStates.has(chatId)) {
    userStates.set(chatId, {});
  }
  return userStates.get(chatId)!;
}

/**
 * Clear user state
 */
function clearUserState(chatId: string) {
  userStates.delete(chatId);
}

async function getTelegramAdmin(chatId: string) {
  return prisma.users.findFirst({
    where: { telegram_chat_id: chatId, role: 'admin', status: 'active' },
    select: { id: true, first_name: true, email: true },
  });
}

function getCommandArguments(ctx: BotContext): string {
  const match = ctx.match;
  if (typeof match === 'string') return match.trim();
  if (Array.isArray(match)) return match.join(' ').trim();
  return '';
}

bot.command('admin', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  if (!chatId || !(await getTelegramAdmin(chatId))) {
    await ctx.reply('⛔ Эта команда доступна только администраторам.');
    return;
  }

  await ctx.reply(
    '🛡 Админ-команды\n\n' +
    '/users - список пользователей\n' +
    '/user email - данные пользователя\n' +
    '/setrole email роль - изменить роль\n' +
    '/keys - активные ключи бота\n' +
    '/help - общие команды'
  );
});

bot.command('users', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  if (!chatId || !(await getTelegramAdmin(chatId))) {
    await ctx.reply('⛔ Эта команда доступна только администраторам.');
    return;
  }

  const users = await prisma.users.findMany({
    orderBy: { created_at: 'desc' },
    take: 30,
    select: { email: true, first_name: true, last_name: true, role: true, status: true, telegram_chat_id: true },
  });

  if (users.length === 0) {
    await ctx.reply('Пользователей пока нет.');
    return;
  }

  const lines = users.map((user, index) =>
    `${index + 1}. ${user.first_name} ${user.last_name || ''}`.trim() +
    `\n   ${user.email} | ${user.role} | ${user.status} | Telegram: ${user.telegram_chat_id ? 'да' : 'нет'}`
  );
  await ctx.reply(`👥 Последние пользователи (${users.length})\n\n${lines.join('\n')}`);
});

bot.command('user', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  if (!chatId || !(await getTelegramAdmin(chatId))) {
    await ctx.reply('⛔ Эта команда доступна только администраторам.');
    return;
  }

  const email = getCommandArguments(ctx).toLowerCase();
  if (!email) {
    await ctx.reply('Использование: /user email@example.com');
    return;
  }

  const user = await prisma.users.findUnique({
    where: { email },
    select: {
      email: true,
      first_name: true,
      last_name: true,
      role: true,
      status: true,
      phone: true,
      telegram_username: true,
      telegram_chat_id: true,
      two_fa_enabled: true,
      created_at: true,
    },
  });

  if (!user) {
    await ctx.reply('Пользователь не найден.');
    return;
  }

  await ctx.reply(
    `👤 ${user.first_name} ${user.last_name || ''}\n` +
    `📧 ${user.email}\n` +
    `🎭 Роль: ${user.role}\n` +
    `📊 Статус: ${user.status}\n` +
    `📱 Telegram: ${user.telegram_username ? `@${user.telegram_username}` : 'не привязан'}\n` +
    `🔐 2FA: ${user.two_fa_enabled ? 'включена' : 'выключена'}\n` +
    `📅 Создан: ${user.created_at.toLocaleDateString('ru-RU')}`
  );
});

bot.command('setrole', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  const admin = chatId ? await getTelegramAdmin(chatId) : null;
  if (!admin) {
    await ctx.reply('⛔ Эта команда доступна только администраторам.');
    return;
  }

  const [email, role] = getCommandArguments(ctx).toLowerCase().split(/\s+/);
  const roles = ['customer', 'employee', 'kitchen', 'manager', 'admin'] as const;
  if (!email || !roles.includes(role as typeof roles[number])) {
    await ctx.reply('Использование: /setrole email@example.com customer|employee|kitchen|manager|admin');
    return;
  }

  const user = await prisma.users.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user) {
    await ctx.reply('Пользователь не найден.');
    return;
  }

  await prisma.users.update({ where: { id: user.id }, data: { role: role as typeof roles[number] } });
  logger.info('Telegram admin changed user role', { adminId: admin.id, userId: user.id, role });
  await ctx.reply(`✅ Роль пользователя ${user.email} изменена на ${role}.`);
});

bot.command('keys', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  if (!chatId || !(await getTelegramAdmin(chatId))) {
    await ctx.reply('⛔ Эта команда доступна только администраторам.');
    return;
  }

  const keys = await prisma.bot_access_keys.findMany({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
    take: 20,
    select: { key: true, key_type: true, uses_count: true, max_uses: true, expires_at: true },
  });

  await ctx.reply(keys.length
    ? `🔑 Активные ключи\n\n${keys.map((key) => `${key.key} | ${key.key_type} | ${key.uses_count}/${key.max_uses ?? '∞'}`).join('\n')}`
    : 'Активных ключей нет.');
});

/**
 * /start command handler
 * Welcome message and instructions
 */
bot.command('start', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  const firstName = ctx.from?.first_name || 'Пользователь';
  
  if (!chatId) {
    await ctx.reply('❌ Не удалось определить ваш чат. Попробуйте ещё раз.');
    return;
  }

  // Check if already linked
  const existingUser = await prisma.users.findFirst({
    where: { telegram_chat_id: chatId },
    select: {
      email: true,
      first_name: true,
      role: true,
      telegram_activated_with_key: true,
    },
  });

  if (existingUser) {
    await ctx.reply(
      `✅ Привет, ${existingUser.first_name}!\n\n` +
      `Ваш аккаунт уже активирован.\n` +
      `📧 Email: ${existingUser.email}\n` +
      `🎭 Роль: ${existingUser.role}\n` +
      `🔑 Активирован ключом: ${existingUser.telegram_activated_with_key}\n\n` +
      `Используйте /login для входа или /help для помощи.`
    );
    return;
  }

  await ctx.reply(
    `👋 Привет, ${firstName}!\n\n` +
    `🤖 Я бот CaféFlow для управления рестораном.\n\n` +
    `🔐 Для доступа к боту требуется ключ активации.\n` +
    `Ключи выдаются только администраторами.\n\n` +
    `📋 Команды:\n` +
    `• /activate - Активировать аккаунт с ключом\n` +
    `• /login - Войти в систему\n` +
    `• /status - Проверить статус\n` +
    `• /help - Справка\n\n` +
    `Для начала используйте /activate`
  );
});

/**
 * /activate command handler
 * Activate account with access key
 */
bot.command('activate', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  
  if (!chatId) {
    await ctx.reply('❌ Не удалось определить ваш чат.');
    return;
  }

  // Check if already activated
  const existingUser = await prisma.users.findFirst({
    where: { telegram_chat_id: chatId },
  });

  if (existingUser) {
    await ctx.reply(
      `✅ Вы уже активированы!\n\n` +
      `Используйте /login для входа в систему.`
    );
    return;
  }

  // Set state to await key
  const state = getUserState(chatId);
  state.awaitingKey = true;

  await ctx.reply(
    `🔑 Активация аккаунта\n\n` +
    `Введите ваш ключ доступа.\n` +
    `Формат ключа: CAFEFLOW-XXX-XXXXXXXXXXXX\n\n` +
    `Ключи выдаются администраторами системы.`
  );
});

/**
 * /login command handler
 * Login to system
 */
bot.command('login', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  
  if (!chatId) {
    await ctx.reply('❌ Не удалось определить ваш чат.');
    return;
  }

  // Check if activated
  const user = await prisma.users.findFirst({
    where: { telegram_chat_id: chatId },
  });

  if (!user) {
    await ctx.reply(
      `❌ Аккаунт не активирован\n\n` +
      `Сначала активируйте аккаунт с помощью /activate`
    );
    return;
  }

  await ctx.reply(
    `🔐 Вход в систему\n\n` +
    `Перейдите на сайт CaféFlow и войдите через форму логина.\n` +
    `Код подтверждения придёт в этот бот автоматически.\n\n` +
    `🌐 ${process.env.NEXT_PUBLIC_APP_URL || 'https://cafeflow.app'}/login`
  );
});

/**
 * /status command handler
 * Shows current account linking status
 */
bot.command('status', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  
  if (!chatId) {
    await ctx.reply('❌ Не удалось определить ваш чат.');
    return;
  }

  try {
    // Find user linked to this Telegram
    const user = await prisma.users.findFirst({
      where: { telegram_chat_id: chatId },
      select: {
        id: true,
        email: true,
        display_name: true,
        first_name: true,
        role: true,
        two_fa_enabled: true,
        telegram_username: true,
        telegram_activated_with_key: true,
        created_at: true,
      },
    });

    if (!user) {
      await ctx.reply(
        `❌ Аккаунт не активирован\n\n` +
        `Этот Telegram не связан ни с одним аккаунтом CaféFlow.\n\n` +
        `Для активации используйте /activate`
      );
      return;
    }

    // Account is linked - show info
    const roleEmoji: Record<string, string> = {
      admin: '👑',
      manager: '👔',
      employee: '👤',
      kitchen: '👨‍🍳',
      customer: '🙋',
      guest: '👻',
    };

    await ctx.reply(
      `✅ Аккаунт активирован\n\n` +
      `${roleEmoji[user.role] || '👤'} ${user.display_name || user.first_name}\n` +
      `📧 ${user.email}\n` +
      `🎭 Роль: ${user.role}\n` +
      `🔐 2FA: ${user.two_fa_enabled ? 'Включен ✅' : 'Отключен ❌'}\n` +
      `🔑 Ключ: ${user.telegram_activated_with_key || 'Не указан'}\n\n` +
      `Всё работает! Используйте /login для входа.`
    );
  } catch (error) {
    logger.error('Error checking status', error);
    await ctx.reply('❌ Произошла ошибка при проверке статуса.');
  }
});

/**
 * /help command handler
 * Shows available commands and usage
 */
bot.command('help', async (ctx: BotContext) => {
  await ctx.reply(
    `📚 Справка по командам\n\n` +
    `🔹 /start - Приветствие\n` +
    `🔹 /activate - Активировать аккаунт с ключом\n` +
    `🔹 /login - Войти в систему\n` +
    `🔹 /status - Проверить статус активации\n` +
    `🔹 /admin - Админ-команды (только для админов)\n` +
    `🔹 /help - Показать эту справку\n\n` +
    `❓ Как это работает:\n\n` +
    `1️⃣ Получите ключ доступа от администратора\n` +
    `2️⃣ Активируйте бота командой /activate\n` +
    `3️⃣ Введите email и пароль от вашего аккаунта\n` +
    `4️⃣ Бот будет связан с вашим аккаунтом\n` +
    `5️⃣ Используйте /login для входа на сайт\n\n` +
    `🔐 Безопасность:\n` +
    `• Ключи выдаются только админами\n` +
    `• Один ключ = один аккаунт\n` +
    `• Пароли не сохраняются в боте\n\n` +
    `🌐 CaféFlow - Автоматизация ресторанов`
  );
});

/**
 * Handle text messages (for activation flow)
 */
bot.on('message:text', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  const text = ctx.message?.text;
  const username = ctx.from?.username;
  
  if (!chatId || !text) return;
  
  // Ignore commands
  if (text.startsWith('/')) return;
  
  const state = getUserState(chatId);
  
  // Step 1: Awaiting access key
  if (state.awaitingKey) {
    try {
      // Validate key format
      if (!text.startsWith('CAFEFLOW-')) {
        await ctx.reply(
          `❌ Неверный формат ключа.\n\n` +
          `Ключ должен начинаться с CAFEFLOW-\n` +
          `Пример: CAFEFLOW-MAS-A1B2C3D4E5F6`
        );
        return;
      }
      
      // Check key validity
      const accessKey = await prisma.bot_access_keys.findUnique({
        where: { key: text.trim().toUpperCase() },
      });
      
      if (!accessKey) {
        await ctx.reply(
          `❌ Ключ не найден.\n\n` +
          `Проверьте правильность ввода или обратитесь к администратору.`
        );
        return;
      }
      
      if (!accessKey.is_active) {
        await ctx.reply(`❌ Ключ деактивирован.`);
        return;
      }
      
      if (accessKey.expires_at && new Date(accessKey.expires_at) < new Date()) {
        await ctx.reply(`❌ Срок действия ключа истёк.`);
        return;
      }
      
      if (accessKey.max_uses !== null && accessKey.uses_count >= accessKey.max_uses) {
        await ctx.reply(`❌ Достигнут лимит использований ключа.`);
        return;
      }
      
      // Key is valid - proceed to email
      state.awaitingKey = false;
      state.awaitingEmail = true;
      state.keyValidated = {
        keyId: accessKey.id,
        keyType: accessKey.key_type,
      };
      
      await ctx.reply(
        `✅ Ключ принят!\n\n` +
        `📧 Теперь введите ваш email от аккаунта CaféFlow:`
      );
      
    } catch (error) {
      logger.error('Error validating key', error);
      await ctx.reply(`❌ Ошибка при проверке ключа.`);
      clearUserState(chatId);
    }
    return;
  }
  
  // Step 2: Awaiting email
  if (state.awaitingEmail) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(text)) {
      await ctx.reply(
        `❌ Неверный формат email.\n\n` +
        `Введите корректный email адрес.`
      );
      return;
    }
    
    // Check if user exists
    const user = await prisma.users.findFirst({
      where: { email: text.toLowerCase() },
    });
    
    if (!user) {
      await ctx.reply(
        `❌ Пользователь с таким email не найден.\n\n` +
        `Сначала зарегистрируйтесь на сайте CaféFlow.`
      );
      clearUserState(chatId);
      return;
    }
    
    // Check if already activated
    if (user.telegram_chat_id && user.telegram_activated_with_key) {
      await ctx.reply(
        `❌ Этот аккаунт уже активирован в Telegram.\n\n` +
        `Если это ваш аккаунт, обратитесь к администратору.`
      );
      clearUserState(chatId);
      return;
    }
    
    // Email is valid - proceed to password
    state.awaitingEmail = false;
    state.awaitingPassword = true;
    state.email = text.toLowerCase();
    
    await ctx.reply(
      `✅ Email найден!\n\n` +
      `🔐 Теперь введите ваш пароль:\n\n` +
      `⚠️ Пароль будет проверен и НЕ сохранится в боте.`
    );
    return;
  }
  
  // Step 3: Awaiting password
  if (state.awaitingPassword && state.email && state.keyValidated) {
    try {
      // Find user
      const user = await prisma.users.findFirst({
        where: { email: state.email },
      });
      
      if (!user || !user.password_hash) {
        await ctx.reply(`❌ Ошибка аутентификации.`);
        clearUserState(chatId);
        return;
      }
      
      // Verify password
      const isValid = await verifyPassword(text, user.password_hash);
      
      if (!isValid) {
        await ctx.reply(
          `❌ Неверный пароль.\n\n` +
          `Попробуйте ещё раз или начните заново с /activate`
        );
        clearUserState(chatId);
        return;
      }
      
      // Password correct - activate account
      await prisma.$transaction(async (tx) => {
        // Update user
        await tx.users.update({
          where: { id: user.id },
          data: {
            telegram_chat_id: chatId,
            telegram_username: username || null,
            telegram_activated_with_key: (await tx.bot_access_keys.findUnique({
              where: { id: state.keyValidated!.keyId },
            }))!.key,
            two_fa_enabled: true,
          },
        });
        
        // Create activation record
        await tx.bot_key_activations.create({
          data: {
            key_id: state.keyValidated!.keyId,
            user_id: user.id,
            telegram_chat_id: chatId,
          },
        });
        
        // Increment key usage
        await tx.bot_access_keys.update({
          where: { id: state.keyValidated!.keyId },
          data: { uses_count: { increment: 1 } },
        });
      });
      
      await ctx.reply(
        `🎉 Активация завершена!\n\n` +
        `✅ Аккаунт привязан к Telegram\n` +
        `✅ 2FA автоматически включен\n\n` +
        `👤 ${user.first_name}\n` +
        `📧 ${user.email}\n` +
        `🎭 Роль: ${user.role}\n\n` +
        `Теперь используйте /login для входа на сайт.`
      );
      
      clearUserState(chatId);
      
    } catch (error) {
      logger.error('Error activating account', error);
      await ctx.reply(`❌ Ошибка при активации аккаунта.`);
      clearUserState(chatId);
    }
    return;
  }
  
  // No active state - show help
  await ctx.reply(
    `Я понимаю только команды.\n\n` +
    `Используйте /help для списка команд.`
  );
});


logger.info('Telegram handlers initialized');

export default bot;
