# Система локализации CafeFlow

## Структура

```
src/app/i18n/
├── config.ts          # Поддерживаемые языки и их названия
├── catalog.ts         # Типизированный каталог переводов
├── utils.ts           # Хелперы выбора языка и каталога
└── locales/
  ├── ru/            # Русский язык
  ├── en/            # English
  └── kg/            # Кыргызский язык
```

Поддерживаемые локали: `ru`, `kg`, `en`. Локаль по умолчанию: `ru`.
Каждый язык содержит одинаковые каталоги: `api`, `auth`, `common`, `landing`,
`dashboard`, `delivery`, `checkout`, `ui`, `admin` и `cafe`.

## Добавление нового языка

1. Добавьте код языка в `config.ts`:
```typescript
export const locales = ['ru', 'kg', 'en'] as const;
```

2. Создайте папку для языка в `src/app/i18n/locales/`
3. Скопируйте все JSON-каталоги из существующего языка
4. Добавьте язык в каждый объект `translationCatalog` в `catalog.ts`
5. Переведите тексты

## Добавление новой страницы

1. Добавьте ключ каталога в `TranslationCatalog` в `catalog.ts`.
2. Создайте JSON-файл для каждого языка:
  - `src/app/i18n/locales/ru/page-name.json`
  - `src/app/i18n/locales/en/page-name.json`
  - `src/app/i18n/locales/kg/page-name.json`

3. Используйте каталог в компоненте:
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

## URL структура

- `/` → автоматический редирект на локализованный маршрут
- `/ru` → русская версия
- `/en` → English version
- `/kg` → кыргызская версия
