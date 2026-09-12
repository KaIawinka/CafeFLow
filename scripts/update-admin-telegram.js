require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const ADMIN_EMAIL = 'admin@cafeflow.com';
const TELEGRAM_CHAT_ID = '6288343249';

async function updateAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🔧 Updating admin with Telegram...\n');

    // Find admin first
    const existingAdmin = await prisma.users.findFirst({
      where: { email: ADMIN_EMAIL },
    });

    if (!existingAdmin) {
      console.error('❌ Admin not found!');
      return;
    }

    // Update with telegram
    const admin = await prisma.users.update({
      where: { id: existingAdmin.id },
      data: {
        telegram_chat_id: TELEGRAM_CHAT_ID,
        two_fa_enabled: true,
      },
    });

    console.log('✅ Admin updated successfully!\n');
    console.log('📧 Email:', admin.email);
    console.log('📱 Telegram Chat ID:', admin.telegram_chat_id);
    console.log('🔐 2FA Enabled:', admin.two_fa_enabled);
    console.log('\n✨ Теперь можете входить в админку с 2FA!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();
