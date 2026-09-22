/**
 * Telegram Bot Command Handlers
 * Handles /start, /activate, /login, /status, /help commands
 */

import { bot, type BotContext } from './bot';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { verifyPassword } from '@/lib/auth/password';
import { consumeTelegramLinkCode, unlinkTelegramAccount } from './utils';

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

bot?.command('admin', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  if (!chatId || !(await getTelegramAdmin(chatId))) {
    await ctx.reply('⛔ Эта команда доступна только администраторам.');
    return;
  }

  await ctx.reply(
    '👑 *Админ-команды CaféFlow*\n\n' +
    '👥 `/users` — список последних пользователей\n' +
    '🔍 `/user email@example.com` — информация о пользователе\n' +
    '🎭 `/setrole email@example.com роль` — изменить роль\n' +
    '   Роли: customer, employee, kitchen, manager, admin\n' +
    '🔑 `/keys` — активные ключи активации\n' +
    '❓ `/help` — общие команды\n\n' +
    '💡 Все изменения логируются в системе.',
    { parse_mode: 'Markdown' }
  );
});

bot?.command('users', async (ctx: BotContext) => {
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
    await ctx.reply('📭 Пользователей пока нет.');
    return;
  }

  const roleEmoji: Record<string, string> = {
    admin: '👑', manager: '👔', employee: '👤', kitchen: '👨‍🍳', customer: '🙋', guest: '👻'
  };

  const statusEmoji: Record<string, string> = {
    active: '✅', inactive: '⏸', suspended: '🚫', pending: '⏳'
  };

  const lines = users.map((user, index) => {
    const role = roleEmoji[user.role] || '👤';
    const status = statusEmoji[user.status] || '❓';
    const telegram = user.telegram_chat_id ? '✅' : '❌';
    return (
      `${index + 1}. ${role} *${user.first_name} ${user.last_name || ''}*\n` +
      `   📧 ${user.email}\n` +
      `   📊 ${user.role} ${status} • TG: ${telegram}`
    );
  });
  
  await ctx.reply(
    `👥 *Последние пользователи* (${users.length})\n\n${lines.join('\n\n')}`,
    { parse_mode: 'Markdown' }
  );
});

bot?.command('user', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  if (!chatId || !(await getTelegramAdmin(chatId))) {
    await ctx.reply('⛔ Эта команда доступна только администраторам.');
    return;
  }

  const email = getCommandArguments(ctx).toLowerCase();
  if (!email) {
    await ctx.reply('📝 Использование: `/user email@example.com`', { parse_mode: 'Markdown' });
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
      last_login_at: true,
    },
  });

  if (!user) {
    await ctx.reply('❌ Пользователь не найден.');
    return;
  }

  const roleEmoji: Record<string, string> = {
    admin: '👑', manager: '👔', employee: '👤', kitchen: '👨‍🍳', customer: '🙋', guest: '👻'
  };

  await ctx.reply(
    `👤 *${user.first_name} ${user.last_name || ''}*\n\n` +
    `📧 Email: ${user.email}\n` +
    `📱 Телефон: ${user.phone || 'не указан'}\n` +
    `${roleEmoji[user.role] || '👤'} Роль: *${user.role}*\n` +
    `📊 Статус: ${user.status}\n` +
    `💬 Telegram: ${user.telegram_username ? `@${user.telegram_username}` : 'не привязан'}\n` +
    `🔐 2FA: ${user.two_fa_enabled ? '✅ включена' : '❌ выключена'}\n` +
    `📅 Создан: ${user.created_at.toLocaleDateString('ru-RU')}\n` +
    `🕐 Последний вход: ${user.last_login_at ? user.last_login_at.toLocaleString('ru-RU') : 'никогда'}`,
    { parse_mode: 'Markdown' }
  );
});

bot?.command('setrole', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  const admin = chatId ? await getTelegramAdmin(chatId) : null;
  if (!admin) {
    await ctx.reply('⛔ Эта команда доступна только администраторам.');
    return;
  }

  const [email, role] = getCommandArguments(ctx).toLowerCase().split(/\s+/);
  const roles = ['customer', 'employee', 'kitchen', 'manager', 'admin'] as const;
  if (!email || !roles.includes(role as typeof roles[number])) {
    await ctx.reply(
      '📝 *Использование:*\n' +
      '`/setrole email@example.com роль`\n\n' +
      '*Доступные роли:*\n' +
      '🙋 customer — клиент\n' +
      '👤 employee — сотрудник\n' +
      '👨‍🍳 kitchen — кухня\n' +
      '👔 manager — менеджер\n' +
      '👑 admin — администратор',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const user = await prisma.users.findUnique({ where: { email }, select: { id: true, email: true, first_name: true } });
  if (!user) {
    await ctx.reply('❌ Пользователь не найден.');
    return;
  }

  await prisma.users.update({ where: { id: user.id }, data: { role: role as typeof roles[number] } });
  logger.info('Telegram admin changed user role', { adminId: admin.id, userId: user.id, role });
  
  const roleEmoji: Record<string, string> = {
    customer: '🙋', employee: '👤', kitchen: '👨‍🍳', manager: '👔', admin: '👑'
  };
  
  await ctx.reply(
    `✅ *Роль изменена*\n\n` +
    `👤 ${user.first_name} (${user.email})\n` +
    `${roleEmoji[role]} Новая роль: *${role}*`,
    { parse_mode: 'Markdown' }
  );
});

bot?.command('keys', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  if (!chatId || !(await getTelegramAdmin(chatId))) {
    await ctx.reply('⛔ Эта команда доступна только администраторам.');
    return;
  }

  const keys = await prisma.bot_access_keys.findMany({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
    take: 20,
    select: { key: true, key_type: true, uses_count: true, max_uses: true, expires_at: true, description: true },
  });

  if (keys.length === 0) {
    await ctx.reply('📭 Активных ключей нет.\n\nКлючи можно создать в админ-панели.');
    return;
  }

  const lines = keys.map((key, index) => {
    const uses = `${key.uses_count}/${key.max_uses ?? '∞'}`;
    const expires = key.expires_at ? `до ${new Date(key.expires_at).toLocaleDateString('ru-RU')}` : 'бессрочный';
    const desc = key.description ? `\n   📝 ${key.description}` : '';
    return `${index + 1}. \`${key.key}\`\n   📊 Тип: ${key.key_type} • ${uses} • ${expires}${desc}`;
  });

  await ctx.reply(
    `🔑 *Активные ключи активации* (${keys.length})\n\n${lines.join('\n\n')}`,
    { parse_mode: 'Markdown' }
  );
});

/**
 * /start command handler
 * Welcome message and instructions
 */
bot?.command('start', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  const firstName = ctx.from?.first_name || 'Пользователь';
  
  if (!chatId) {
    await ctx.reply('❌ Не удалось определить ваш чат. Попробуйте ещё раз.');
    return;
  }

  const linkCode = getCommandArguments(ctx);
  if (linkCode) {
    const result = await consumeTelegramLinkCode(linkCode, chatId, ctx.from?.username);
    if (!result.success) {
      await ctx.reply(`❌ ${result.error || 'Не удалось привязать аккаунт.'}`);
      return;
    }

    await ctx.reply(
      `✅ Аккаунт успешно привязан к Telegram, ${firstName}!\n\n` +
      `🔐 Двухфакторная аутентификация включена.\n` +
      `Теперь коды для входа будут приходить в этот бот.`,
    );
    logger.info('User linked Telegram through authenticated deep link', { userId: result.userId, chatId });
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
    const roleEmoji: Record<string, string> = {
      admin: '👑', manager: '👔', employee: '👤', kitchen: '👨‍🍳', customer: '🙋', guest: '👻'
    };
    
    await ctx.reply(
      `✅ Привет, *${existingUser.first_name}*!\n\n` +
      `Ваш аккаунт уже активирован в CaféFlow.\n\n` +
      `📧 Email: ${existingUser.email}\n` +
      `${roleEmoji[existingUser.role] || '👤'} Роль: ${existingUser.role}\n` +
      `🔑 Ключ активации: \`${existingUser.telegram_activated_with_key}\`\n\n` +
      `🔐 Используйте /login для входа\n` +
      `❓ Используйте /help для справки`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await ctx.reply(
    `👋 Привет, *${firstName}*!\n\n` +
    `🍽 Я *CaféFlow Bot* — ваш помощник в управлении рестораном.\n\n` +
    `✨ *Что я умею:*\n` +
    `• 🔐 Безопасная авторизация в системе\n` +
    `• 🔑 Двухфакторная аутентификация (2FA)\n` +
    `• 📊 Управление пользователями (для админов)\n` +
    `• 🔔 Уведомления о заказах и событиях\n\n` +
    `⚠️ *Для работы требуется ключ активации*\n` +
    `Ключи выдаются только администраторами системы.\n\n` +
    `📋 *Основные команды:*\n` +
    `🔑 /activate — Активировать аккаунт с ключом\n` +
    `🔐 /login — Войти в систему\n` +
    `📊 /status — Проверить статус активации\n` +
    `❓ /help — Полная справка\n\n` +
    `🚀 Начните с команды /activate`,
    { parse_mode: 'Markdown' }
  );
});

/**
 * /activate command handler
 * Activate account with access key
 */
bot?.command('activate', async (ctx: BotContext) => {
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
      `✅ *Вы уже активированы!*\n\n` +
      `Ваш аккаунт *${existingUser.first_name}* (${existingUser.email}) уже привязан к этому Telegram.\n\n` +
      `🔐 Используйте /login для входа в систему\n` +
      `📊 Используйте /status для проверки статуса`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Set state to await key
  const state = getUserState(chatId);
  state.awaitingKey = true;

  await ctx.reply(
    `🔑 *Активация аккаунта CaféFlow*\n\n` +
    `Введите ваш ключ доступа.\n\n` +
    `📝 Формат ключа:\n` +
    `\`CAFEFLOW-XXX-XXXXXXXXXXXX\`\n\n` +
    `💡 Ключи выдаются администраторами системы.\n` +
    `Если у вас нет ключа, обратитесь к администратору.`,
    { parse_mode: 'Markdown' }
  );
});

/**
 * /login command handler
 * Login to system
 */
bot?.command('login', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  
  if (!chatId) {
    await ctx.reply('❌ Не удалось определить ваш чат.');
    return;
  }

  // Check if activated
  const user = await prisma.users.findFirst({
    where: { telegram_chat_id: chatId },
    select: {
      first_name: true,
      email: true,
      role: true,
      two_fa_enabled: true,
    },
  });

  if (!user) {
    await ctx.reply(
      `❌ *Аккаунт не активирован*\n\n` +
      `Сначала активируйте аккаунт с помощью команды /activate\n\n` +
      `💡 Для активации требуется ключ от администратора.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cafeflow.app';
  const loginUrl = `${appUrl}/login`;

  await ctx.reply(
    `🔐 *Вход в CaféFlow*\n\n` +
    `Привет, *${user.first_name}*!\n\n` +
    `📧 Email: ${user.email}\n` +
    `🎭 Роль: ${user.role}\n` +
    `🔐 2FA: ${user.two_fa_enabled ? '✅ включена' : '❌ выключена'}\n\n` +
    `🌐 Перейдите на сайт и войдите через форму входа:\n` +
    `${loginUrl}\n\n` +
    `💬 Код подтверждения ${user.two_fa_enabled ? 'будет' : 'может быть'} отправлен в этот бот автоматически.`,
    { parse_mode: 'Markdown' }
  );
});

/**
 * /status command handler
 * Shows current account linking status
 */
bot?.command('status', async (ctx: BotContext) => {
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
        last_name: true,
        role: true,
        status: true,
        two_fa_enabled: true,
        telegram_username: true,
        telegram_activated_with_key: true,
        created_at: true,
        last_login_at: true,
      },
    });

    if (!user) {
      await ctx.reply(
        `❌ *Аккаунт не активирован*\n\n` +
        `Этот Telegram не связан ни с одним аккаунтом CaféFlow.\n\n` +
        `🔑 Для активации используйте команду /activate\n` +
        `💡 Требуется ключ от администратора`,
        { parse_mode: 'Markdown' }
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

    const statusEmoji: Record<string, string> = {
      active: '✅',
      inactive: '⏸',
      suspended: '🚫',
      pending: '⏳',
    };

    await ctx.reply(
      `✅ *Аккаунт активирован*\n\n` +
      `👤 *${user.display_name || `${user.first_name} ${user.last_name || ''}`.trim()}*\n` +
      `📧 Email: ${user.email}\n` +
      `${roleEmoji[user.role] || '👤'} Роль: *${user.role}*\n` +
      `${statusEmoji[user.status] || '❓'} Статус: ${user.status}\n` +
      `🔐 2FA: ${user.two_fa_enabled ? '✅ Включен' : '❌ Отключен'}\n` +
      `💬 Telegram: @${user.telegram_username || 'не указан'}\n` +
      `🔑 Ключ активации: \`${user.telegram_activated_with_key || 'не указан'}\`\n` +
      `📅 Дата регистрации: ${user.created_at.toLocaleDateString('ru-RU')}\n` +
      `🕐 Последний вход: ${user.last_login_at ? user.last_login_at.toLocaleString('ru-RU') : 'никогда'}\n\n` +
      `🎉 Всё работает! Используйте /login для входа.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    logger.error('Error checking status', error);
    await ctx.reply('❌ Произошла ошибка при проверке статуса. Попробуйте позже.');
  }
});

async function handleTelegramUnlink(ctx: BotContext) {
  const chatId = ctx.chat?.id.toString();
  if (!chatId) {
    await ctx.reply('❌ Не удалось определить ваш чат.');
    return;
  }

  if (getCommandArguments(ctx).toLowerCase() !== 'confirm') {
    await ctx.reply(
      '⚠️ *Отвязка Telegram*\n\n' +
      'Команда отключит связь Telegram с аккаунтом, 2FA и удалит активные коды входа.\n\n' +
      'Если вы уверены, отправьте: `/unlink confirm`',
      { parse_mode: 'Markdown' },
    );
    return;
  }

  const user = await prisma.users.findFirst({
    where: { telegram_chat_id: chatId },
    select: { id: true, email: true },
  });
  if (!user) {
    await ctx.reply('ℹ️ Этот Telegram не связан с аккаунтом CaféFlow.');
    return;
  }

  const result = await unlinkTelegramAccount(user.id, chatId);
  if (!result.success) {
    await ctx.reply('❌ Не удалось отвязать Telegram. Попробуйте ещё раз.');
    return;
  }

  logger.info('User unlinked Telegram from bot', { userId: user.id, chatId });
  await ctx.reply(
    `✅ Telegram отвязан от аккаунта ${user.email}.\n\n` +
    '🔐 2FA отключена, активные коды входа удалены.\n' +
    'Чтобы привязать Telegram снова, создайте новую ссылку в настройках аккаунта.',
  );
}

bot?.command('unlink', handleTelegramUnlink);
bot?.command('disconnect', handleTelegramUnlink);

/**
 * /help command handler
 * Shows available commands and usage
 */
bot?.command('help', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  const isAdmin = chatId ? !!(await getTelegramAdmin(chatId)) : false;

  let helpText = 
    `📚 *Справка по командам CaféFlow Bot*\n\n` +
    `🏠 /start — Приветствие и информация о боте\n` +
    `🔑 /activate — Активировать аккаунт по ключу\n` +
    `🔐 /login — Получить ссылку для входа\n` +
    `🔓 /unlink — Отвязать Telegram от аккаунта\n` +
    `📊 /status — Проверить статус активации\n` +
    `❓ /help — Показать эту справку\n`;

  if (isAdmin) {
    helpText += 
      `\n👑 *Админ-команды:*\n` +
      `/admin — Справка по админ-командам\n` +
      `/users — Список пользователей\n` +
      `/user — Информация о пользователе\n` +
      `/setrole — Изменить роль пользователя\n` +
      `/keys — Активные ключи активации\n`;
  }

  helpText += 
    `\n━━━━━━━━━━━━━━━━━━━━\n\n` +
    `❓ *Как это работает:*\n\n` +
    `1️⃣ Получите ключ доступа от администратора\n` +
    `2️⃣ Используйте команду /activate\n` +
    `3️⃣ Введите ваш ключ активации\n` +
    `4️⃣ Укажите email и пароль от аккаунта\n` +
    `5️⃣ Готово! Теперь бот связан с вашим аккаунтом\n` +
    `6️⃣ Для входа на сайт используйте /login\n\n` +
    `🔐 *Безопасность:*\n` +
    `✓ Ключи выдаются только администраторами\n` +
    `✓ Один ключ может быть использован ограниченное число раз\n` +
    `✓ Пароли не сохраняются в боте\n` +
    `✓ Все коды 2FA действуют только 5 минут\n` +
    `✓ Все действия логируются\n\n` +
    `💡 *Полезные ссылки:*\n` +
    `🌐 Сайт: ${process.env.NEXT_PUBLIC_APP_URL || 'https://cafeflow.app'}\n\n` +
    `🍽 CaféFlow — Автоматизация ресторанов`;

  await ctx.reply(helpText, { parse_mode: 'Markdown' });
});

/**
 * Handle text messages (for activation flow)
 */
bot?.on('message:text', async (ctx: BotContext) => {
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
      const keyText = text.trim().toUpperCase();
      if (!keyText.startsWith('CAFEFLOW-')) {
        await ctx.reply(
          `❌ *Неверный формат ключа*\n\n` +
          `Ключ должен начинаться с \`CAFEFLOW-\`\n\n` +
          `Пример правильного ключа:\n` +
          `\`CAFEFLOW-MAS-A1B2C3D4E5F6\``,
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      // Check key validity
      const accessKey = await prisma.bot_access_keys.findUnique({
        where: { key: keyText },
      });
      
      if (!accessKey) {
        await ctx.reply(
          `❌ *Ключ не найден*\n\n` +
          `Проверьте правильность ввода или обратитесь к администратору.\n\n` +
          `💡 Введите ключ заново или используйте /activate для отмены.`
        );
        return;
      }
      
      if (!accessKey.is_active) {
        await ctx.reply(`❌ *Ключ деактивирован*\n\nОбратитесь к администратору для получения нового ключа.`);
        clearUserState(chatId);
        return;
      }
      
      if (accessKey.expires_at && new Date(accessKey.expires_at) < new Date()) {
        await ctx.reply(`❌ *Срок действия ключа истёк*\n\nОбратитесь к администратору для получения нового ключа.`);
        clearUserState(chatId);
        return;
      }
      
      if (accessKey.max_uses !== null && accessKey.uses_count >= accessKey.max_uses) {
        await ctx.reply(`❌ *Достигнут лимит использований ключа*\n\nОбратитесь к администратору для получения нового ключа.`);
        clearUserState(chatId);
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
        `✅ *Ключ принят!*\n\n` +
        `🔑 Тип ключа: ${accessKey.key_type}\n` +
        `${accessKey.description ? `📝 ${accessKey.description}\n\n` : '\n'}` +
        `📧 Теперь введите ваш email от аккаунта CaféFlow:\n\n` +
        `💡 Вы должны быть зарегистрированы в системе.`,
        { parse_mode: 'Markdown' }
      );
      
    } catch (error) {
      logger.error('Error validating key', error);
      await ctx.reply(`❌ *Ошибка при проверке ключа*\n\nПопробуйте позже или обратитесь к администратору.`, { parse_mode: 'Markdown' });
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
        `❌ *Неверный формат email*\n\n` +
        `Введите корректный email адрес.\n\n` +
        `Пример: user@example.com`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Check if user exists
    const user = await prisma.users.findFirst({
      where: { email: text.toLowerCase() },
    });
    
    if (!user) {
      await ctx.reply(
        `❌ *Пользователь с таким email не найден*\n\n` +
        `Сначала зарегистрируйтесь на сайте CaféFlow:\n` +
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://cafeflow.app'}/register\n\n` +
        `💡 После регистрации вернитесь и активируйте бот.`,
        { parse_mode: 'Markdown' }
      );
      clearUserState(chatId);
      return;
    }
    
    // Check if already activated
    if (user.telegram_chat_id && user.telegram_activated_with_key) {
      await ctx.reply(
        `❌ *Этот аккаунт уже активирован в Telegram*\n\n` +
        `Если это ваш аккаунт и вы потеряли доступ к предыдущему Telegram, обратитесь к администратору.`,
        { parse_mode: 'Markdown' }
      );
      clearUserState(chatId);
      return;
    }
    
    // Email is valid - proceed to password
    state.awaitingEmail = false;
    state.awaitingPassword = true;
    state.email = text.toLowerCase();
    
    await ctx.reply(
      `✅ *Email найден!*\n\n` +
      `👤 ${user.first_name} ${user.last_name || ''}\n\n` +
      `🔐 Теперь введите ваш пароль:\n\n` +
      `⚠️ *Важно:*\n` +
      `• Пароль будет проверен и НЕ сохранится в боте\n` +
      `• Используйте пароль от вашего аккаунта CaféFlow\n` +
      `• Сообщение с паролем автоматически удалится`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Step 3: Awaiting password
  if (state.awaitingPassword && state.email && state.keyValidated) {
    try {
      // Try to delete the message with password for security
      try {
        await ctx.deleteMessage();
      } catch {
        // Ignore if can't delete
      }

      // Find user
      const user = await prisma.users.findFirst({
        where: { email: state.email },
      });
      
      if (!user || !user.password_hash) {
        await ctx.reply(`❌ *Ошибка аутентификации*\n\nПопробуйте заново с /activate`, { parse_mode: 'Markdown' });
        clearUserState(chatId);
        return;
      }
      
      // Verify password
      const isValid = await verifyPassword(text, user.password_hash);
      
      if (!isValid) {
        await ctx.reply(
          `❌ *Неверный пароль*\n\n` +
          `Попробуйте ещё раз или начните заново с /activate\n\n` +
          `💡 Убедитесь, что используете пароль от CaféFlow аккаунта`,
          { parse_mode: 'Markdown' }
        );
        clearUserState(chatId);
        return;
      }
      
      // Password correct - activate account
      const keyUsed = await prisma.$transaction(async (tx) => {
        // Get key info
        const key = await tx.bot_access_keys.findUnique({
          where: { id: state.keyValidated!.keyId },
        });

        // Update user
        await tx.users.update({
          where: { id: user.id },
          data: {
            telegram_chat_id: chatId,
            telegram_username: username || null,
            telegram_activated_with_key: key!.key,
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

        return key!.key;
      });
      
      const roleEmoji: Record<string, string> = {
        admin: '👑', manager: '👔', employee: '👤', kitchen: '👨‍🍳', customer: '🙋', guest: '👻'
      };

      await ctx.reply(
        `🎉 *Активация завершена!*\n\n` +
        `✅ Аккаунт успешно привязан к Telegram\n` +
        `✅ Двухфакторная аутентификация (2FA) включена\n\n` +
        `👤 *Ваш профиль:*\n` +
        `${roleEmoji[user.role] || '👤'} ${user.first_name} ${user.last_name || ''}\n` +
        `📧 ${user.email}\n` +
        `🎭 Роль: *${user.role}*\n` +
        `🔑 Ключ: \`${keyUsed}\`\n\n` +
        `🔐 Теперь используйте /login для входа на сайт.\n` +
        `📊 Проверьте статус командой /status`,
        { parse_mode: 'Markdown' }
      );
      
      clearUserState(chatId);
      logger.info('User activated via Telegram bot', { userId: user.id, chatId, keyType: state.keyValidated.keyType });
      
    } catch (error) {
      logger.error('Error activating account', error);
      await ctx.reply(`❌ *Ошибка при активации аккаунта*\n\nПопробуйте позже или обратитесь к администратору.`, { parse_mode: 'Markdown' });
      clearUserState(chatId);
    }
    return;
  }
  
  // No active state - show help
  await ctx.reply(
    `💬 Я понимаю только команды.\n\n` +
    `Используйте /help для списка команд.`
  );
});


logger.info('Telegram handlers initialized');

export default bot;
