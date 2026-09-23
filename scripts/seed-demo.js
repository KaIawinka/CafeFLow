require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const products = [
  // Горячие напитки (вес в граммах для расчета)
  ['espresso', 'Эспрессо', 'Классический двойной эспрессо из зерен арабики высшего качества', 120, 60, 3, 'Горячие напитки'],
  ['americano', 'Американо', 'Эспрессо с горячей водой, мягкий и насыщенный вкус', 140, 250, 4, 'Горячие напитки'],
  ['cappuccino', 'Капучино', 'Эспрессо с молоком и воздушной молочной пенкой', 170, 250, 5, 'Горячие напитки'],
  ['latte', 'Латте', 'Нежный кофейный напиток с большим количеством молока', 180, 350, 5, 'Горячие напитки'],
  ['flat-white', 'Флэт уайт', 'Двойной эспрессо с бархатистой микропенкой', 190, 250, 6, 'Горячие напитки'],
  ['mocha', 'Мокка', 'Латте с шоколадом и взбитыми сливками', 210, 350, 6, 'Горячие напитки'],
  ['hot-chocolate', 'Горячий шоколад', 'Насыщенный напиток из темного шоколада со сливками', 200, 300, 5, 'Горячие напитки'],
  ['tea-black', 'Черный чай', 'Классический цейлонский чай с насыщенным вкусом', 100, 400, 4, 'Горячие напитки'],
  ['tea-green', 'Зеленый чай', 'Японский зеленый чай сенча с тонким ароматом', 110, 400, 4, 'Горячие напитки'],
  
  // Холодные напитки
  ['iced-latte', 'Айс латте', 'Охлажденный латте со льдом и молоком', 200, 400, 5, 'Холодные напитки'],
  ['cold-brew', 'Колд брю', 'Кофе холодного заваривания с мягким вкусом', 220, 350, 5, 'Холодные напитки'],
  ['frappe', 'Фраппе', 'Взбитый кофейный напиток со льдом и сливками', 230, 400, 6, 'Холодные напитки'],
  ['lemonade', 'Лимонад домашний', 'Свежий лимонад с мятой и имбирем', 180, 400, 5, 'Холодные напитки'],
  ['matcha-tonic', 'Матча тоник', 'Японский зеленый чай матча с тоником и лаймом', 260, 400, 5, 'Холодные напитки'],
  ['smoothie-berry', 'Смузи ягодный', 'Микс из свежих ягод с йогуртом и медом', 280, 350, 7, 'Холодные напитки'],
  ['fresh-orange', 'Фреш апельсиновый', 'Свежевыжатый сок из сладких апельсинов', 250, 300, 4, 'Холодные напитки'],
  
  // Завтраки
  ['croissant-plain', 'Круассан классический', 'Свежеиспеченный французский круассан из слоеного теста', 150, 80, 3, 'Завтраки'],
  ['croissant-chocolate', 'Круассан шоколадный', 'Круассан с начинкой из бельгийского шоколада', 170, 90, 3, 'Завтраки'],
  ['avocado-toast', 'Тост с авокадо', 'Цельнозерновой хлеб с гуакамоле, яйцом пашот и семенами чиа', 420, 280, 12, 'Завтраки'],
  ['scrambled-eggs', 'Яичница-болтунья', 'Нежная яичница с беконом, томатами и тостом', 380, 250, 10, 'Завтраки'],
  ['pancakes', 'Панкейки', 'Американские панкейки с кленовым сиропом и ягодами', 450, 300, 15, 'Завтраки'],
  ['granola-bowl', 'Гранола боул', 'Домашняя гранола с греческим йогуртом и свежими фруктами', 390, 320, 8, 'Завтраки'],
  
  // Основные блюда
  ['burger-beef', 'Бургер говяжий', 'Сочная котлета из мраморной говядины с овощами и соусом', 680, 350, 18, 'Основные блюда'],
  ['burger-chicken', 'Бургер куриный', 'Хрустящая куриная котлета с салатом айсберг и сырным соусом', 620, 340, 16, 'Основные блюда'],
  ['pasta-carbonara', 'Паста карбонара', 'Спагетти с беконом, сливочным соусом и пармезаном', 590, 350, 20, 'Основные блюда'],
  ['pasta-bolognese', 'Паста болоньезе', 'Тальятелле с мясным соусом по классическому рецепту', 620, 360, 22, 'Основные блюда'],
  ['salmon-bowl', 'Боул с лососем', 'Рис, слабосоленый лосось, эдамаме, авокадо и кунжутный соус', 780, 390, 18, 'Основные блюда'],
  ['chicken-teriyaki', 'Курица терияки', 'Куриное филе в соусе терияки с рисом и овощами вок', 650, 380, 20, 'Основные блюда'],
  ['steak-ribeye', 'Стейк рибай', 'Мраморный стейк рибай средней прожарки с овощами гриль', 1450, 280, 25, 'Основные блюда'],
  ['soup-mushroom', 'Крем-суп грибной', 'Нежный крем-суп из лесных грибов со сливками', 380, 350, 15, 'Основные блюда'],
  
  // Салаты
  ['salad-caesar', 'Цезарь', 'Классический салат с курицей, сыром пармезан и соусом цезарь', 480, 280, 12, 'Салаты'],
  ['salad-greek', 'Греческий салат', 'Свежие овощи с сыром фета и маслинами', 420, 270, 10, 'Салаты'],
  ['salad-nicoise', 'Нисуаз', 'Французский салат с тунцом, яйцом и стручковой фасолью', 520, 300, 14, 'Салаты'],
  
  // Десерты
  ['tiramisu', 'Тирамису', 'Классический итальянский десерт с маскарпоне и кофе', 380, 150, 4, 'Десерты'],
  ['cheesecake-berry', 'Чизкейк ягодный', 'Нью-йоркский чизкейк с соусом из свежих ягод', 350, 160, 4, 'Десерты'],
  ['brownie', 'Брауни', 'Шоколадный брауни с грецким орехом и мороженым', 320, 140, 5, 'Десерты'],
  ['eclair', 'Эклер', 'Французский эклер с заварным кремом и шоколадной глазурью', 210, 100, 3, 'Десерты'],
  ['apple-pie', 'Яблочный пирог', 'Домашний пирог с корицей и ванильным мороженым', 290, 180, 6, 'Десерты'],
  ['creme-brulee', 'Крем-брюле', 'Французский десерт с карамельной корочкой', 330, 130, 5, 'Десерты'],
];

const tableSeed = [
  // Основной зал
  ['Столик 01', 'Основной зал', 2], ['Столик 02', 'Основной зал', 2], ['Столик 03', 'Основной зал', 4],
  ['Столик 04', 'Основной зал', 4], ['Столик 05', 'Основной зал', 4], ['Столик 06', 'Основной зал', 6],
  ['Столик 07', 'Основной зал', 6], ['Столик 08', 'Основной зал', 8],
  
  // VIP зона
  ['VIP 01', 'VIP зона', 4], ['VIP 02', 'VIP зона', 6], ['VIP 03', 'VIP зона', 8],
  ['VIP 04', 'VIP зона', 10],
  
  // Веранда
  ['Веранда 01', 'Веранда', 2], ['Веранда 02', 'Веранда', 2], ['Веранда 03', 'Веранда', 4],
  ['Веранда 04', 'Веранда', 4], ['Веранда 05', 'Веранда', 6], ['Веранда 06', 'Веранда', 6],
  ['Веранда 07', 'Веранда', 8],
  
  // Тихая зона
  ['Тихая зона 01', 'Тихая зона', 2], ['Тихая зона 02', 'Тихая зона', 2],
  ['Тихая зона 03', 'Тихая зона', 4], ['Тихая зона 04', 'Тихая зона', 4],
  
  // У окна
  ['У окна 01', 'У окна', 2], ['У окна 02', 'У окна', 2], ['У окна 03', 'У окна', 4],
  ['У окна 04', 'У окна', 4],
  
  // Барная стойка
  ['Барная стойка 01', 'Барная стойка', 1], ['Барная стойка 02', 'Барная стойка', 1],
  ['Барная стойка 03', 'Барная стойка', 1], ['Барная стойка 04', 'Барная стойка', 1],
  ['Барная стойка 05', 'Барная стойка', 2], ['Барная стойка 06', 'Барная стойка', 2],
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const tenant = await prisma.tenants.upsert({ where: { slug: 'cafeflow-demo' }, update: { status: 'active' }, create: { name: 'CaféFlow Demo', slug: 'cafeflow-demo', status: 'active', currency: 'KGS', timezone: 'Asia/Bishkek' } });
  const branch = await prisma.branches.findFirst({ where: { tenant_id: tenant.id, code: 'MAIN' } }) || await prisma.branches.create({ data: { tenant_id: tenant.id, name: 'Основной зал', code: 'MAIN', status: 'active', timezone: 'Asia/Bishkek' } });
  const categories = new Map();
  for (const name of ['Горячие напитки', 'Холодные напитки', 'Завтраки', 'Основные блюда', 'Салаты', 'Десерты']) {
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
