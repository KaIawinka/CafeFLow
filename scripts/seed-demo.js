require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const products = [
  ['flat-white', 'Флэт уайт', 'Двойной эспрессо, шелковистое молоко и плотная пенка.', 180, '250 мл', 6, 'Напитки'],
  ['avocado-toast', 'Тост с авокадо', 'Хлеб на закваске, авокадо, яйцо пашот и хлопья чили.', 420, '280 г', 12, 'Завтраки'],
  ['salmon-bowl', 'Боул с лососем', 'Рис, лосось, эдамаме, огурец и кунжутный соус.', 680, '390 г', 18, 'Основные блюда'],
  ['chicken-waffle', 'Вафля с курицей', 'Хрустящая вафля, курица, коул-слоу и медовый соус.', 560, '350 г', 16, 'Основные блюда'],
  ['matcha-tonic', 'Матча-тоник', 'Церемониальная матча, тоник, лайм и лед.', 260, '400 мл', 5, 'Напитки'],
  ['berry-cheesecake', 'Чизкейк с ягодами', 'Сливочный чизкейк с соусом из сезонных ягод.', 320, '160 г', 4, 'Десерты'],
];

const tableSeed = [
  ['Столик 01', 'Зал', 2], ['Столик 02', 'Зал', 4], ['Столик 03', 'Тихая зона', 2],
  ['Столик 04', 'Веранда', 4], ['Столик 05', 'Веранда', 6], ['Столик 06', 'Зал', 8],
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const tenant = await prisma.tenants.upsert({ where: { slug: 'cafeflow-demo' }, update: { status: 'active' }, create: { name: 'CaféFlow Demo', slug: 'cafeflow-demo', status: 'active', currency: 'KGS', timezone: 'Asia/Bishkek' } });
  const branch = await prisma.branches.findFirst({ where: { tenant_id: tenant.id, code: 'MAIN' } }) || await prisma.branches.create({ data: { tenant_id: tenant.id, name: 'Основной зал', code: 'MAIN', status: 'active', timezone: 'Asia/Bishkek' } });
  const categories = new Map();
  for (const name of ['Завтраки', 'Основные блюда', 'Напитки', 'Десерты']) {
    const category = await prisma.menu_categories.findFirst({ where: { tenant_id: tenant.id, slug: name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-') } }) || await prisma.menu_categories.create({ data: { tenant_id: tenant.id, name, slug: name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-'), sort_order: categories.size, is_active: true } });
    categories.set(name, category.id);
  }
  for (const [index, [slug, name, description, price, weight, preparation, categoryName]] of products.entries()) {
    const existing = await prisma.products.findFirst({ where: { tenant_id: tenant.id, slug } });
    if (existing) await prisma.products.update({ where: { id: existing.id }, data: { name, description, price, weight, preparation_minutes: preparation, category_id: categories.get(categoryName), is_available: true, deleted_at: null } });
    else await prisma.products.create({ data: { tenant_id: tenant.id, category_id: categories.get(categoryName), name, slug, description, price, currency: 'KGS', weight, preparation_minutes: preparation, image_file_ids: [], modifiers: [], allergens: [], is_available: true, is_featured: index < 2, sort_order: index } });
  }
  for (const [index, [name, zone, capacity]] of tableSeed.entries()) {
    const existing = await prisma.restaurant_tables.findFirst({ where: { tenant_id: tenant.id, branch_id: branch.id, name } });
    if (!existing) await prisma.restaurant_tables.create({ data: { tenant_id: tenant.id, branch_id: branch.id, name, zone, capacity, status: 'active', position: { x: index % 3, y: Math.floor(index / 3) } } });
  }
  console.log(`Seeded tenant ${tenant.slug}, branch ${branch.code}, ${products.length} products and ${tableSeed.length} tables.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); await pool.end(); });
