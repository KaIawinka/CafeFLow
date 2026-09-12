#!/usr/bin/env node

const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8944458761:AAHhZGPZNrDrzCxfOAPXE34QbBHzVkVjW8I';

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
  console.log('🤖 Настройка Telegram бота...\n');

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

  // 2. Установка описания
  console.log('2️⃣ Установка описания...');
  const descResult = await makeRequest('setMyDescription', {
    description: 'Бот для двухфакторной аутентификации в CaféFlow Admin Panel.\n\nОтправляет коды для входа в систему управления рестораном.\n\nБезопасно. Коды действуют 5 минут.'
  });
  console.log(descResult.ok ? '✅ Описание установлено\n' : `❌ Ошибка: ${descResult.description}\n`);

  // 3. Установка короткого описания
  console.log('3️⃣ Установка короткого описания...');
  const shortDescResult = await makeRequest('setMyShortDescription', {
    short_description: 'Бот 2FA для CaféFlow Admin'
  });
  console.log(shortDescResult.ok ? '✅ Короткое описание установлено\n' : `❌ Ошибка: ${shortDescResult.description}\n`);

  // 4. Установка команд
  console.log('4️⃣ Установка команд...');
  const commandsResult = await makeRequest('setMyCommands', {
    commands: [
      { command: 'start', description: 'Привязать аккаунт к Telegram' },
      { command: 'status', description: 'Проверить статус привязки' },
      { command: 'help', description: 'Справка по командам' }
    ]
  });
  console.log(commandsResult.ok ? '✅ Команды установлены\n' : `❌ Ошибка: ${commandsResult.description}\n`);

  // 5. Информация
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Настройка завершена!\n');
  console.log('📱 Ваш бот: https://t.me/' + botInfo.result.username);
  console.log('\n💡 Что дальше:');
  console.log('   1. Откройте бота в Telegram');
  console.log('   2. Нажмите START');
  console.log('   3. Бот готов к работе!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

setupBot().catch(console.error);
