/**
 * Create Admin User Script
 * Creates first admin user with email and password
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME || 'Admin';
const ADMIN_TELEGRAM_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID;

async function createAdmin() {
  console.log('🔧 Creating admin user...\n');

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env');
    process.exit(1);
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_TELEGRAM_CHAT_ID) {
    console.error('❌ Set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_TELEGRAM_CHAT_ID before running this script.');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  
  // Setup Prisma Client with Pg adapter (works for both local and Neon)
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ 
    adapter,
    log: ['error'],
  });

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.users.findFirst({
      where: { 
        email: ADMIN_EMAIL 
      },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.first_name}`);
      console.log(`🎭 Role: ${existingAdmin.role}`);
      console.log(`📊 Status: ${existingAdmin.status}`);
      console.log('\n💡 Use this email and password to login to /admin/login');
      await prisma.$disconnect();
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await prisma.users.create({
      data: {
        email: ADMIN_EMAIL,
        password_hash: passwordHash,
        first_name: ADMIN_FIRST_NAME,
        role: 'admin',
        status: 'active',
        two_fa_enabled: !!ADMIN_TELEGRAM_CHAT_ID,
        telegram_chat_id: ADMIN_TELEGRAM_CHAT_ID || null,
      },
    });

    await prisma.user_settings.create({
      data: {
        user_id: admin.id,
        email_notifications: true,
        push_notifications: true,
        telegram_notifications: true,
      },
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', ADMIN_EMAIL);
    console.log('🔑 Password: ', 'the value from ADMIN_PASSWORD');
    console.log('👤 Name:     ', ADMIN_FIRST_NAME);
    console.log('🎭 Role:     ', admin.role);
    console.log('📊 Status:   ', admin.status);
    console.log('🆔 ID:       ', admin.id);
    console.log('📱 Telegram: ', admin.telegram_chat_id || 'Не привязан');
    console.log('🔐 2FA:      ', admin.two_fa_enabled ? 'Включен ✅' : 'Отключен ❌');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!admin.telegram_chat_id) {
      console.log('⚠️  Telegram не привязан!');
      console.log('');
      console.log('Чтобы включить 2FA:');
      console.log('1. Получите ваш Telegram Chat ID (@userinfobot)');
      console.log('2. Обновите пользователя:');
      console.log('   UPDATE users SET telegram_chat_id = \'YOUR_CHAT_ID\', two_fa_enabled = true WHERE email = \'admin@cafeflow.com\';');
      console.log('');
    }

    console.log('🚀 Next steps:');
    console.log('1. Add bot token to settings (optional - uses env TELEGRAM_BOT_TOKEN by default):');
    console.log('   INSERT INTO settings (id, key, value, description, is_public, created_at, updated_at)');
    console.log('   VALUES (gen_random_uuid(), \'ADMIN_TELEGRAM_BOT_TOKEN\', \'YOUR_BOT_TOKEN\', \'Bot Token\', false, NOW(), NOW());');
    console.log('');
    console.log('2. Login to admin panel:');
    console.log('   → http://localhost:3000/ru/admin/login');
    console.log('   → Email: admin@cafeflow.com');
    console.log('   → Password: the value from ADMIN_PASSWORD');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
