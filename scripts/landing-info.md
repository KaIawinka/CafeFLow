# Информация о лендинге CaféFlow

## 🎯 Быстрый старт

```bash
# Запуск в режиме разработки
npm run dev

# Открыть в браузере
# Русская версия: http://localhost:3000/ru
# Кыргызская версия: http://localhost:3000/kg

# Сборка для production
npm run build
npm start
```

## 📂 Структура файлов лендинга

```
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                 # Главная страница (собирает все секции)
│   │   └── layout.tsx               # Layout с header
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── ru/
│   │   │   │   ├── common.json      # Meta, навигация
│   │   │   │   └── landing.json     # Весь контент лендинга
│   │   │   └── kg/
│   │   │       ├── common.json
│   │   │       └── landing.json
│   │   ├── config.ts                # Конфигурация языков
│   │   └── utils.ts                 # Хелперы для i18n
│   └── globals.css                  # Глобальные стили
└── components/
    ├── Header.tsx                   # Хедер с навигацией
    ├── LanguageSwitcher.tsx         # Переключатель языков
    └── landing/
        ├── HeroSection.tsx          # Главная секция
        ├── ProblemsSection.tsx      # Проблемы владельцев
        ├── FeaturesSection.tsx      # Ключевые функции
        ├── BenefitsSection.tsx      # Преимущества
        ├── AudienceSection.tsx      # Целевая аудитория
        ├── TechSection.tsx          # Технологии
        ├── CTASection.tsx           # Призыв к действию
        ├── ContactForm.tsx          # Форма обратной связи
        ├── Footer.tsx               # Подвал
        └── ScrollReveal.tsx         # Анимация при скролле
```

## 🎨 Основные секции

### 1. Hero Section
**Файл**: `HeroSection.tsx`
**Контент**: `landing.json → hero`

- Основной заголовок и подзаголовок
- Описание продукта
- 2 CTA кнопки
- Статистика (4 показателя)
- Mockup интерфейса

**Редактирование**:
```json
"hero": {
  "badge": "Текст бейджа",
  "title": "Главный заголовок",
  "subtitle": "Подзаголовок с акцентом",
  "description": "Описание продукта",
  "cta": {
    "primary": "Текст главной кнопки",
    "secondary": "Текст второй кнопки"
  }
}
```

### 2. Problems Section
**Файл**: `ProblemsSection.tsx`
**Контент**: `landing.json → problems`

4 проблемы владельцев заведений с иконками

### 3. Features Section
**Файл**: `FeaturesSection.tsx`
**Контент**: `landing.json → features`

6 ключевых функций системы с градиентами

### 4. Benefits Section
**Файл**: `BenefitsSection.tsx`
**Контент**: `landing.json → benefits`

6 преимуществ решения

### 5. Audience Section
**Файл**: `AudienceSection.tsx`
**Контент**: `landing.json → audience`

4 типа целевых заведений

### 6. Tech Section
**Файл**: `TechSection.tsx`
**Контент**: `landing.json → tech`

Технологический стек и показатели

### 7. CTA + Contact Form
**Файлы**: `CTASection.tsx`, `ContactForm.tsx`
**Контент**: `landing.json → cta`

Яркий баннер + форма обратной связи

### 8. Footer
**Файл**: `Footer.tsx`
**Контент**: `landing.json → footer`

Навигация, ссылки, соцсети

## 🎨 Цветовая схема

```javascript
// Основной градиент
'from-amber-600 to-orange-600'

// Варианты для разных секций
'from-blue-500 to-cyan-500'      // Бронирование
'from-purple-500 to-pink-500'    // Кухня
'from-green-500 to-emerald-500'  // Лояльность
'from-indigo-500 to-purple-500'  // Аналитика
```

## 🔧 Частые задачи

### Изменить текст
1. Открыть `src/app/i18n/locales/ru/landing.json`
2. Найти нужный ключ
3. Изменить значение
4. Сохранить (hot reload автоматический)

### Добавить новую секцию
1. Создать компонент в `src/components/landing/NewSection.tsx`
2. Добавить переводы в `landing.json`
3. Импортировать в `src/app/[locale]/page.tsx`
4. Добавить в render

### Изменить порядок секций
В файле `src/app/[locale]/page.tsx` изменить порядок компонентов:
```tsx
<HeroSection t={t} />
<ProblemsSection t={t} />
<FeaturesSection t={t} />
// ... остальные
```

### Изменить цветовую схему
Заменить классы градиентов в нужных компонентах:
```tsx
// Было
className="from-amber-600 to-orange-600"

// Стало (например, синий)
className="from-blue-600 to-indigo-600"
```

### Добавить анимацию
Обернуть элемент в `ScrollReveal`:
```tsx
import { ScrollReveal } from "./ScrollReveal";

<ScrollReveal delay={200}>
  <div>Ваш контент</div>
</ScrollReveal>
```

## 📱 Адаптивность

Брейкпоинты Tailwind:
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px

Проверить на:
- Mobile: 375px (iPhone)
- Tablet: 768px (iPad)
- Desktop: 1440px

## 🧪 Тестирование

### Проверка контента
```bash
# Русская версия
http://localhost:3000/ru

# Кыргызская версия
http://localhost:3000/kg
```

### Проверка навигации
Все якорные ссылки должны работать:
- `#features` → Секция функций
- `#pricing` → (пока перенаправляет)
- `#demo` → CTA секция
- `#contact` → Форма

### Проверка формы
1. Заполнить все обязательные поля
2. Нажать "Отправить"
3. Должен показаться success message

## 🚀 Деплой

### Vercel (рекомендуется)
```bash
# Установить Vercel CLI
npm i -g vercel

# Задеплоить
vercel
```

### Docker
```bash
# Build
docker build -t cafeflow-landing .

# Run
docker run -p 3000:3000 cafeflow-landing
```

### Static Export
```bash
npm run build
# Файлы в .next/
```

## 📊 Метрики для отслеживания

1. **Конверсия формы** - сколько заявок оставляют
2. **Время на сайте** - средняя сессия
3. **Scroll depth** - до куда скроллят
4. **Bounce rate** - процент отказов
5. **Клики CTA** - по каждой кнопке

## 🔗 Полезные ссылки

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors)
- [Hero Icons](https://heroicons.com/) - для иконок

## 💡 Рекомендации

1. **Добавить реальные фото/скриншоты** вместо mockup'ов
2. **Интегрировать с CRM** для форм обратной связи
3. **Добавить отзывы** реальных клиентов
4. **A/B тестирование** разных вариантов CTA
5. **Добавить видео** демонстрацию продукта
6. **SEO оптимизация** - мета-теги, Open Graph
7. **Analytics** - Google Analytics, Yandex Metrica

## 🐛 Troubleshooting

### Не работают стили
```bash
# Очистить кэш
rm -rf .next
npm run dev
```

### Не показываются переводы
Проверить:
1. Правильность структуры JSON
2. Путь к файлу перевода
3. Ключ в `t.section.key`

### Проблемы с типами
```bash
# Перегенерировать типы
npm run build
```

## 📧 Контакты

По вопросам лендинга: обращайтесь к команде разработки CaféFlow
