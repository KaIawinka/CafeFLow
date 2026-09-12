/**
 * Telegram Bot Command Handlers
 * Handles /start, /status, /help commands
 */

import { bot, type BotContext } from './bot';
import { prisma } from '@/lib/prisma';
import { sendVerificationCode, formatVerificationMessage } from './messages';

/**
 * /start command handler
 * Used for linking Telegram account to CaféFlow
 */
bot.command('start', async (ctx: BotContext) => {
  const chatId = ctx.chat?.id.toString();
  const username = ctx.from?.username;
  const firstName = ctx.from?.first_name || 'User';
  
  // Check if command has a parameter (link code)
  const commandText = ctx.message?.text || '';
  const parts = commandText.split(' ');
  const linkCode = parts.length > 1 ? parts[1] : null;

  if (!chatId) {
    await ctx.reply('❌ Не удалось определить ваш чат. Попробуйте ещё раз.');
    return;
  }

  // If link code provided - attempt to link account
  if (linkCode) {
    try {
      // Find valid link code
      const linkRecord = await prisma.telegram_link_codes.findFirst({
        where: {
          code: linkCode,
          used_at: null,
          expires_at: { gt: new Date() },
        },
      });

      if (!linkRecord) {
        await ctx.reply(
          '❌ Код недействителен или истёк.\n\n' +
          'Запросите новый код в настройках админ-панели.'
        );
        return;
      }

      // Check if this Telegram already linked to another account
      const existingUser = await prisma.users.findFirst({
        where: { telegram_chat_id: chatId },
      });

      if (existingUser && existingUser.id !== linkRecord.user_id) {
        await ctx.reply(
          '❌ Этот Telegram аккаунт уже привязан к другому пользователю.\n\n' +
          'Если это ошибка, обратитесь к администратору.'
        );
        return;
      }

      // Link account
      await prisma.$transaction([
        // Update user with Telegram info
        prisma.users.update({
          where: { id: linkRecord.user_id },
          data: {
            telegram_chat_id: chatId,
            telegram_username: username || null,
            two_fa_enabled: true,
          },
        }),
        // Mark code as used
        prisma.telegram_link_codes.update({
          where: { id: linkRecord.id },
          data: { used_at: new Date() },
        }),
      ]);

      await ctx.reply(
        `✅ Аккаунт успешно привязан!\n\n` +
        `👤 Имя: ${firstName}\n` +
        `🔐 2FA активирован\n\n` +
        `Теперь вы будете получать коды для входа в CaféFlow Admin через этот бот.\n\n` +
        `Используйте /status для проверки статуса или /help для помощи.`
      );
      
      return;
    } catch (error) {
      console.error('Error linking Telegram account:', error);
      await ctx.reply(
        '❌ Произошла ошибка при привязке аккаунта.\n\n' +
        'Попробуйте ещё раз или обратитесь к администратору.'
      );
      return;
    }
  }

  // No link code - show welcome message
  await ctx.reply(
    `👋 Привет, ${firstName}!\n\n` +
    `Я бот CaféFlow для двухфакторной аутентификации.\n\n` +
    `📋 Что я умею:\n` +
    `• Отправлять коды для входа в админ-панель\n` +
    `• Подтверждать важные операции\n` +
    `• Уведомлять о событиях\n\n` +
    `🔗 Для привязки аккаунта:\n` +
    `1. Войдите в админ-панель CaféFlow\n` +
    `2. Перейдите в настройки Telegram\n` +
    `3. Нажмите "Привязать Telegram"\n` +
    `4. Перейдите по полученной ссылке\n\n` +
    `Используйте /help для списка команд.`
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
        role: true,
        two_fa_enabled: true,
        telegram_username: true,
        created_at: true,
      },
    });

    if (!user) {
      await ctx.reply(
        `❌ Аккаунт не привязан\n\n` +
        `Этот Telegram не связан ни с одним аккаунтом CaféFlow.\n\n` +
        `Для привязки:\n` +
        `1. Войдите в админ-панель\n` +
        `2. Перейдите в настройки\n` +
        `3. Получите ссылку для привязки\n\n` +
        `Используйте /help для помощи.`
      );
      return;
    }

    // Account is linked - show info
    const linkedDate = user.created_at.toLocaleDateString('ru-RU');
    const roleEmoji = {
      admin: '👑',
      manager: '👔',
      employee: '👤',
      kitchen: '👨‍🍳',
      customer: '🙋',
    };

    await ctx.reply(
      `✅ Аккаунт привязан\n\n` +
      `${roleEmoji[user.role] || '👤'} ${user.display_name || user.email}\n` +
      `📧 ${user.email}\n` +
      `🎭 Роль: ${user.role}\n` +
      `🔐 2FA: ${user.two_fa_enabled ? 'Включен ✅' : 'Отключен ❌'}\n` +
      `📅 Привязан: ${linkedDate}\n\n` +
      `Всё работает! Вы будете получать коды для входа в этот бот.`
    );
  } catch (error) {
    console.error('Error checking status:', error);
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
    `🔹 /start - Приветствие и инструкция по привязке\n` +
    `🔹 /status - Проверить статус привязки аккаунта\n` +
    `🔹 /help - Показать эту справку\n\n` +
    `❓ Как это работает:\n\n` +
    `1️⃣ Привяжите свой аккаунт CaféFlow к этому боту\n` +
    `2️⃣ При входе в админ-панель вам придёт код\n` +
    `3️⃣ Введите код на сайте для завершения входа\n\n` +
    `🔐 Безопасность:\n` +
    `• Коды действуют только 5 минут\n` +
    `• Код можно использовать только один раз\n` +
    `• Максимум 3 попытки ввода\n\n` +
    `💡 Если у вас проблемы:\n` +
    `• Убедитесь что аккаунт привязан (/status)\n` +
    `• Проверьте срок действия кода\n` +
    `• Обратитесь к администратору системы\n\n` +
    `🌐 CaféFlow - Автоматизация кафе и ресторанов`
  );
});

/**
 * Handle unknown commands
 */
bot.on('message:text', async (ctx: BotContext) => {
  // Ignore if it's a command (already handled)
  if (ctx.message.text?.startsWith('/')) {
    return;
  }

  // Reply to regular messages
  await ctx.reply(
    `Я понимаю только команды. Используйте /help для списка доступных команд.`
  );
});

/**
 * Handle callback queries (for future buttons)
 */
bot.on('callback_query:data', async (ctx: BotContext) => {
  await ctx.answerCallbackQuery('Функция в разработке');
});

console.log('✅ Telegram handlers initialized');

export default bot;
