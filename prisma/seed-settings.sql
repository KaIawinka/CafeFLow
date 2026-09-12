-- Seed settings table with required admin configuration
-- Run this after creating your first admin user

-- Admin Telegram User ID (chat_id from Telegram)
-- Replace 'YOUR_TELEGRAM_CHAT_ID' with actual admin's Telegram chat ID
INSERT INTO settings (id, key, value, description, is_public, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_USER_ID',
  'YOUR_TELEGRAM_CHAT_ID',
  'Telegram Chat ID администратора для получения 2FA кодов',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = NOW();

-- Admin Telegram Bot Token (optional - falls back to env TELEGRAM_BOT_TOKEN)
-- Replace 'YOUR_BOT_TOKEN' with actual bot token from @BotFather
INSERT INTO settings (id, key, value, description, is_public, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_BOT_TOKEN',
  'YOUR_BOT_TOKEN',
  'Telegram Bot токен для отправки 2FA кодов (optional, uses env if not set)',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = NOW();
