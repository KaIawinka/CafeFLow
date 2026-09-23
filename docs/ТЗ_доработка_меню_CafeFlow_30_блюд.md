# ТЗ: доработка существующего меню CaféFlow на 30 блюд

**Версия:** 1.0  
**Статус:** рабочая спецификация для реализации  
**Основа:** `Доработка.md`, логика меню из DOCX, текущая Prisma-схема и существующие API CaféFlow.

> Это ТЗ адаптировано под реальный CaféFlow. В нём не считаются готовыми функции, для которых существует только Prisma-модель, API-route или кнопка без полного пользовательского сценария.

## 1. Цель

Доработать текущее меню заведения до полноценного server-driven модуля на 30 блюд:

- администратор управляет категориями и блюдами из админки;
- пользователь видит только актуальные и разрешённые к показу блюда;
- цены, доступность и категории приходят из БД;
- корзина и checkout используют server-side данные;
- старый заказ не меняется после редактирования меню;
- модификаторы и состав блюда проектируются расширяемо;
- интерфейс современный, быстрый, доступный и анимированный без перегрузки;
- все критические действия имеют loading, empty, error, success и mobile-состояния.

## 2. Что уже есть в проекте

### Реально существующее

- `menu_categories` и `products` в Prisma;
- public menu API: `/api/public/menu`;
- admin category API;
- admin product GET/POST/PATCH/DELETE API;
- server cart и серверная проверка цены;
- snapshot названия и цены в `order_items`;
- фильтрация блюд из неактивных категорий в public menu;
- базовый экран `/[locale]/admin/menu`;
- public customer menu в `ServerCafeExperience`;
- JSON-поля для `modifiers`, `allergens`, `image_file_ids`.

### Что нельзя считать готовым

- полноценный CRUD категорий;
- управление 30 блюдами с изображениями и составом;
- modifier groups/options;
- редактор allergens и calories;
- расписание доступности;
- media storage workflow;
- drag-and-drop сортировка;
- preview меню в админке;
- menu analytics;
- integration/E2E tests для menu/cart/checkout.

## 3. Источник истины

### Админка

Админка изменяет текущее состояние заведения:

- категория;
- блюдо;
- цена;
- старая цена;
- изображение;
- вес/объём;
- состав;
- калорийность;
- аллергены;
- доступность;
- видимость;
- порядок;
- модификаторы.

### Public menu

Public menu никогда не использует локальный demo-массив как источник истины. Данные берутся из API и Prisma.

Разрешено использовать fallback только как техническое состояние ошибки, но fallback не должен выглядеть как реальные блюда заведения. При ошибке необходимо показывать понятное состояние «Меню временно недоступно».

### Заказ

После оформления в `order_items` фиксируются:

- название блюда;
- цена единицы;
- количество;
- модификаторы;
- сумма модификаторов;
- скидка;
- итог позиции;
- комментарий.

Редактирование блюда в меню не изменяет старые заказы.

## 4. Структура 30 блюд

Меню должно содержать 30 реальных записей в БД. Количество является acceptance criterion, а не поводом вставлять фиктивные карточки в UI.

Рекомендуемая структура:

| Категория | Количество | Порядок |
|---|---:|---:|
| Завтраки | 5 | 10 |
| Основные блюда | 7 | 20 |
| Салаты | 4 | 30 |
| Выпечка и десерты | 5 | 40 |
| Кофе | 5 | 50 |
| Чай и напитки | 4 | 60 |
| **Всего** | **30** | — |

Для каждой записи обязательны реальные значения:

- `name`;
- `category_id`;
- `description`;
- `price`;
- `currency`;
- `sort_order`;
- `is_available`;
- `is_featured`.

Необходимо отдельно согласовать с владельцем кафе фактические названия, цены, состав и изображения. Разработчик не должен придумывать коммерческие данные и выдавать их за данные заведения.

## 5. Модель категории

### Поля

- `id` — UUID;
- `tenant_id` — владелец данных;
- `parent_id` — для будущих подкатегорий;
- `name` — обязательное название;
- `slug` — уникальный в пределах tenant;
- `description` — необязательно;
- `image_file_id` — желательно добавить отдельным полем или согласовать хранение;
- `sort_order` — целое число;
- `is_active` — видимость категории;
- `created_at`;
- `updated_at`.

### Правила

1. Название обязательно.
2. Slug нормализуется на сервере.
3. Категория принадлежит одному tenant.
4. Категорию нельзя удалить, если в ней есть блюда, без явного переноса или архивирования.
5. Неактивная категория не отображается public-пользователю.
6. Блюда неактивной категории не отображаются в public menu.
7. Изменение порядка выполняется транзакционно.
8. Изменение категории не меняет старые заказы.

## 6. Модель блюда

### Поля

- `id`;
- `tenant_id`;
- `category_id`;
- `name`;
- `slug`;
- `description`;
- `composition`;
- `price` — Decimal на сервере;
- `old_price` — nullable Decimal;
- `currency`;
- `weight`;
- `volume`;
- `calories`;
- `image_file_ids`;
- `modifiers` или нормализованные modifier relations;
- `allergens`;
- `preparation_minutes`;
- `sort_order`;
- `is_available`;
- `is_visible` или согласованный статус;
- `is_featured`;
- `deleted_at`;
- `created_at`;
- `updated_at`.

### Статусы

| Статус | Public видимость | Можно добавить в корзину |
|---|---|---|
| `AVAILABLE` | Да | Да |
| `UNAVAILABLE` | Да, с пояснением | Нет |
| `HIDDEN` | Нет | Нет |
| `ARCHIVED` | Нет | Нет |

В текущей схеме `is_available` и `deleted_at` уже существуют. Для полноценного `HIDDEN` нужно добавить явное поле или enum, а не кодировать разные состояния одним boolean.

## 7. Модификаторы

### ModifierGroup

- название;
- тип выбора: single/multiple;
- `min_select`;
- `max_select`;
- `is_required`;
- `sort_order`;
- `is_active`.

### ModifierOption

- название;
- цена;
- старая цена;
- доступность;
- порядок;
- состав/аллергены при необходимости.

### Правила

1. Группа применяется только к назначенным блюдам.
2. Required-группа должна быть заполнена до добавления в корзину.
3. Количество выбранных options проверяется и на клиенте, и на сервере.
4. Цена modifier пересчитывается только сервером.
5. Cart snapshot хранит выбранные options и их цены.
6. Order snapshot не меняется после редактирования modifier в админке.
7. Repeat order повторно проверяет доступность modifier.

## 8. Public menu UX

### Первый экран

Пользователь видит:

- название заведения;
- статус филиала;
- поиск блюда;
- категории;
- счётчик корзины;
- featured-позиции;
- список блюд;
- стоимость;
- доступность;
- время приготовления;
- вес/объём;
- аллергены и состав при раскрытии.

### Поиск

- поиск по названию, описанию, составу и категории;
- debounce для запросов, если поиск становится серверным;
- сохранение фокуса input;
- debounce не должен перезагружать страницу;
- пустой результат с кнопкой сброса;
- keyboard navigation;
- `Escape` очищает поиск.

### Категории

- sticky category navigation на desktop;
- горизонтальный scroll на mobile;
- активная категория синхронизируется с scroll;
- переход к категории плавный;
- при отсутствии категории показывается корректное empty state.

### Карточка блюда

Показывает:

- изображение из storage;
- название;
- описание;
- состав;
- цену;
- old price при наличии;
- скидку только если она подтверждена данными;
- вес/объём;
- время приготовления;
- allergens;
- rating/review count после подключения review aggregation;
- кнопку «В корзину»;
- кнопку избранного для авторизованного пользователя.

Нельзя показывать фальшивые рейтинги, fake photo или выдуманные характеристики.

## 9. Cart integration

1. Одна корзина принадлежит одному tenant и branch.
2. Product добавляется только если `is_available=true` и `deleted_at=null`.
3. Товар из скрытой категории не добавляется.
4. Цена из клиента не принимается как источник истины.
5. Сервер повторно загружает товары и пересчитывает subtotal.
6. Изменение цены показывает пользователю сообщение перед checkout.
7. Пустая корзина имеет отдельный empty state.
8. При смене филиала корзина не должна молча смешивать товары.
9. Если cart принадлежит другому branch, пользователь видит подтверждение очистки.
10. Legacy checkout flow, который отправляет `items` напрямую в orders API, должен быть удалён.

## 10. Checkout

Checkout проверяет:

- наличие активной server cart;
- tenant/branch context;
- доступность каждого товара;
- актуальные цены;
- modifiers;
- fulfillment type;
- адрес и delivery zone;
- минимальную сумму;
- промокод;
- idempotency key;
- допустимость payment method.

Перед транзакцией создания order все проверки повторяются на сервере.

## 11. Admin menu UX

### Главный экран

Показывает:

- число категорий;
- число активных блюд;
- число unavailable блюд;
- статус меню;
- фильтр «Только доступные»;
- поиск;
- кнопку добавления блюда;
- кнопку добавления категории;
- предупреждение о несохранённых изменениях.

### Таблица блюд

Колонки:

- изображение;
- название;
- категория;
- цена;
- старая цена;
- доступность;
- видимость;
- порядок;
- модификаторы;
- дата обновления;
- действия.

### Действия

- создать;
- редактировать;
- duplicate;
- archive;
- restore;
- toggle available;
- toggle visible;
- reorder;
- preview;
- view audit history.

Все действия должны иметь optimistic только при безопасном rollback либо показывать loading до server response.

## 12. Дизайн-система

### Визуальное направление

- тёплая café-палитра: orange accent, charcoal surfaces, cream content;
- контрастный текст;
- карточки с радиусом не более 8–16px согласно контексту;
- плотная сетка без вложенных карточек-карточек;
- крупные изображения блюд как главный сигнал меню;
- mobile-first layout;
- никаких декоративных fake blobs и случайных gradient-orbs.

### Типографика

- выразительный display для названий разделов;
- нейтральный читаемый текст для описаний;
- не использовать hero-size внутри карточек;
- не масштабировать шрифт через viewport width;
- не использовать отрицательный letter-spacing.

### States

Каждый экран и компонент должен иметь:

- loading;
- empty;
- error;
- success;
- disabled;
- unavailable;
- mobile;
- dark theme;
- reduced motion;
- keyboard focus.

## 13. Система анимаций

Анимации должны объяснять состояние, а не быть декорацией ради декорации.

### Tokens

```css
--menu-motion-fast: 160ms;
--menu-motion-base: 260ms;
--menu-motion-slow: 600ms;
--menu-ease: cubic-bezier(0.22, 1, 0.36, 1);
--menu-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Список анимаций

1. Page entrance: fade + translateY для заголовка меню.
2. Category entrance: stagger по категориям.
3. Dish cards: fade + translateY с задержкой по индексу.
4. Image: subtle scale-in после загрузки.
5. Card hover: translateY(-4px), shadow, не менять layout.
6. Add button: press scale `0.97`.
7. Add to cart: короткий confirmation pulse.
8. Cart badge: scale spring при изменении количества.
9. Favorite: heart fill/outline transition.
10. Search results: fade + height transition.
11. Category underline: layout/shared transition.
12. Modifier drawer: slide-up на mobile.
13. Modifier modal: scale + fade с backdrop.
14. Unavailable state: opacity, без тревожного shake.
15. Price update: короткое highlight изменение.
16. Admin row update: background flash после сохранения.
17. Drag reorder: lift shadow и placeholder.
18. Toast: slide-in справа, exit fade.
19. Empty state: один спокойный entrance.
20. Error state: мягкий border highlight, без бесконечной пульсации.

### Reduced motion

При `prefers-reduced-motion: reduce`:

- отключить transform-анимации;
- оставить мгновенное появление и смену цвета;
- не использовать infinite animations;
- не блокировать keyboard focus;
- не скрывать контент до завершения JS observer.

## 14. Performance

- использовать `transform` и `opacity` вместо layout properties;
- не анимировать `width`, `height`, `top`, `left` у больших блоков;
- lazy-load изображений ниже fold;
- задавать aspect-ratio для карточек блюд;
- не запускать десятки infinite animation одновременно;
- IntersectionObserver отключает observer после reveal;
- не перезагружать меню при каждом вводе символа;
- избегать тяжёлой animation library, если CSS решает задачу;
- Motion/Animate.css можно подключать только при необходимости и после измерения bundle/performance.

## 15. Accessibility

- кнопки имеют accessible name;
- unavailable button имеет `disabled` и пояснение;
- star/rating имеет текстовое значение;
- модификаторы доступны с клавиатуры;
- modal закрывается `Escape`;
- focus возвращается на кнопку открытия;
- color не является единственным сигналом статуса;
- reduced-motion проверяется в браузере;
- screen reader не получает дублирующие hidden navigation items.

## 16. API acceptance criteria

### Public

- `GET /api/public/menu` возвращает только видимые и доступные позиции;
- скрытые категории исключаются;
- tenant context обязателен;
- branch context передаётся последовательно;
- ошибки локализованы;
- response содержит `x-request-id`.

### Admin

- все mutations tenant-scoped;
- capability `manage_menu` обязательна;
- category ownership проверяется;
- product ownership проверяется;
- цена валидируется Decimal;
- JSON modifiers/allergens проходят schema validation;
- archive не удаляет историю заказов;
- audit log создаётся для критичных изменений.

### Cart/order

- цена всегда проверяется сервером;
- modifiers проверяются сервером;
- idempotency работает при повторном запросе;
- старый order не меняется после menu update;
- online payment не показывается как доступный до подключения provider.

## 17. План реализации

1. Удалить legacy Cart flow.
2. Зафиксировать menu status model.
3. Добавить category edit/delete/archive.
4. Добавить полную форму блюда.
5. Добавить old price, weight, volume, composition, calories.
6. Добавить media storage contract.
7. Реализовать modifier groups/options.
8. Добавить public modifiers drawer.
9. Добавить cart modifier snapshots.
10. Добавить category filter/active scroll.
11. Добавить server-side search при необходимости.
12. Добавить menu loading/error/empty states.
13. Добавить admin filtering/sorting/pagination.
14. Добавить reorder workflow.
15. Добавить audit history.
16. Добавить design motion tokens.
17. Подключить scroll/stagger animations.
18. Подключить cart/favorite micro-interactions.
19. Добавить reduced-motion tests.
20. Добавить API integration tests.
21. Добавить authenticated menu/cart Playwright flow.
22. Добавить admin menu Playwright flow.
23. Проверить mobile/tablet/desktop.
24. Проверить dark/light theme.
25. Проверить localization ru/en/kg.
26. Проверить accessibility keyboard/screen reader.
27. Проверить production build.
28. Проверить performance и bundle.
29. Выполнить smoke-test с реальными seed/DB данными.
30. Считать меню готовым только после readiness report.

## 18. Acceptance criteria для 30 блюд

Функция считается завершённой, если:

- в БД есть 30 согласованных блюд;
- у каждого есть tenant/category/price/currency;
- public menu показывает только разрешённые записи;
- скрытые категории реально скрывают блюда;
- unavailable блюдо нельзя добавить в cart;
- old order сохраняет старую цену и название;
- modifier snapshot сохраняется в order;
- admin edit отражается в public menu после server response;
- ошибки и empty states проверены;
- animation не ломает layout;
- reduced motion работает;
- все ключевые сценарии покрыты integration/E2E тестами;
- данные не заменены fake fallback-карточками.

## 19. Что нужно от владельца заведения

До заполнения 30 блюд нужны реальные данные:

- названия;
- категории;
- цены;
- валюты;
- описания;
- состав;
- allergens;
- вес/объём;
- calories;
- время приготовления;
- фото;
- modifier options;
- доступность;
- порядок показа.

Без этих данных можно реализовать систему управления и импорт, но нельзя честно заполнять production menu выдуманными блюдами.
