#!/usr/bin/env node

const https = require('https');
require('dotenv/config');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is missing in .env');
  process.exit(1);
}

function makeRequest(method, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function setupBot() {
  console.log('🤖 Настройка Telegram бота CaféFlow...\n');

  // 1. Проверка бота
  console.log('1️⃣ Проверка подключения...');
  const botInfo = await makeRequest('getMe', {});
  if (botInfo.ok) {
    console.log(`✅ Бот найден: @${botInfo.result.username}`);
    console.log(`   Имя: ${botInfo.result.first_name}\n`);
  } else {
    console.error('❌ Ошибка:', botInfo.description);
    process.exit(1);
  }

  // 2. Установка полного описания (видно в профиле бота)
  console.log('2️⃣ Установка описания...');
  const descResult = await makeRequest('setMyDescription', {
    description: '🍽 CaféFlow — система управления рестораном\n\n' +
      '✨ Возможности:\n' +
      '• Безопасная авторизация через Telegram\n' +
      '• Двухфакторная аутентификация (2FA)\n' +
      '• Управление пользователями и ролями\n' +
      '• Уведомления о заказах и бронированиях\n' +
      '• Доступ к админ-панели\n\n' +
      '🔐 Безопасность превыше всего!\n' +
      'Коды действуют только 5 минут.'
  });
  console.log(descResult.ok ? '✅ Описание установлено\n' : `❌ Ошибка: ${descResult.description}\n`);

  // 3. Установка короткого описания (видно в поиске)
  console.log('3️⃣ Установка короткого описания...');
  const shortDescResult = await makeRequest('setMyShortDescription', {
    short_description: '🍽 CaféFlow — управление рестораном и безопасная авторизация'
  });
  console.log(shortDescResult.ok ? '✅ Короткое описание установлено\n' : `❌ Ошибка: ${shortDescResult.description}\n`);

  // 4. Установка команд
  console.log('4️⃣ Установка команд...');
  const commandsResult = await makeRequest('setMyCommands', {
    commands: [
      { command: 'start', description: '🏠 Начать работу с ботом' },
      { command: 'activate', description: '🔑 Активировать аккаунт по ключу' },
      { command: 'login', description: '🔐 Получить ссылку для входа' },
      { command: 'status', description: '📊 Проверить статус активации' },
      { command: 'admin', description: '👑 Команды администратора' },
      { command: 'help', description: '❓ Справка по командам' }
    ]
  });
  console.log(commandsResult.ok ? '✅ Команды установлены\n' : `❌ Ошибка: ${commandsResult.description}\n`);

  // 5. Установка имени бота
  console.log('5️⃣ Установка имени бота...');
  const nameResult = await makeRequest('setMyName', {
    name: '🍽 CaféFlow Bot'
  });
  console.log(nameResult.ok ? '✅ Имя установлено\n' : `❌ Ошибка: ${nameResult.description}\n`);

  // 6. Информация
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Настройка завершена!\n');
  console.log('📱 Ваш бот: https://t.me/' + botInfo.result.username);
  console.log('\n💡 Что дальше:');
  console.log('   1. Откройте бота в Telegram');
  console.log('   2. Нажмите START');
  console.log('   3. Для установки логотипа бота отправьте команду:');
  console.log('      /setuserpic @' + botInfo.result.username);
  console.log('      затем загрузите изображение Logo-CafeFlow.png');
  console.log('   4. Бот готов к работе!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

setupBot().catch(console.error);
