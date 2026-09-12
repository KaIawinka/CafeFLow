-- Обновляем админа - добавляем Telegram Chat ID
UPDATE users 
SET 
  telegram_chat_id = '6288343249',
  two_fa_enabled = true,
  updated_at = NOW()
WHERE email = 'admin@cafeflow.com';

-- Проверяем что обновилось
SELECT 
  email, 
  first_name, 
  role, 
  telegram_chat_id, 
  two_fa_enabled,
  status
FROM users 
WHERE email = 'admin@cafeflow.com';
