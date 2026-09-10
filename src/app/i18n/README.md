# Система локализации CafeFlow

## Структура

```
app/i18n/
├── config.ts          # Конфигурация языков
├── utils.ts           # Хелперы для работы с переводами
└── locales/
    ├── ru/            # Русский язык
    │   ├── landing.json
    │   └── common.json
    └── kg/            # Кыргызский язык
        ├── landing.json
        └── common.json
```

## Добавление нового языка

1. Добавьте код языка в `config.ts`:
```typescript
export const locales = ['ru', 'kg', 'en'] as const;
```

2. Создайте папку для языка в `locales/`
3. Скопируйте JSON файлы из существующего языка
4. Переведите тексты

## Добавление новой страницы

1. Создайте JSON файл для каждого языка:
   - `locales/ru/page-name.json`
   - `locales/kg/page-name.json`

2. Добавьте тип ключа в `utils.ts`:
```typescript
type TranslationKey = 'landing' | 'common' | 'page-name';
```

3. Используйте в компоненте:
```typescript
const t = await getTranslations(locale, 'page-name');
```

## Использование переводов

### Server Component
```typescript
import { getTranslations } from "@/app/i18n/utils";

export default async function Page({ params }) {
  const { locale } = await params;
  const t = await getTranslations(locale, "landing");
  
  return <h1>{t.hero.title}</h1>;
}
```

### Переключатель языков
```typescript
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

<LanguageSwitcher currentLocale={locale} />
```

## URL структура

- `/` → автоматический редирект на `/ru` или `/kg` (по Accept-Language)
- `/ru` → русская версия
- `/kg` → кыргызская версия
- `/ru/about` → русская версия страницы "О нас"
- `/kg/about` → кыргызская версия страницы "О нас"
