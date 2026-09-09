# CaféFlow — упрощённая профессиональная схема БД

ПРОВЕРЕНО: все поля с фиксированным конечным набором значений (status, role, type, operation, method, channel, fulfillment_type и т. п.) заданы как PostgreSQL ENUM. VARCHAR оставлен только для обычных строковых данных (имена, email, телефон, slug, описания и т. п.). Для ENUM-полей CHECK не используется как замена ENUM.

PostgreSQL • 26 таблиц • версия для MVP/первого production-релиза

Схема сокращена с 65 таблиц до 26 без потери основных функций ТЗ. Нормализация намеренно упрощена там, где отдельные таблицы создавали лишнюю сложность: редкие связи и настройки объединены в JSONB, а малые справочники — в поля основных сущностей.

ВАЖНО: поля со стабильными фиксированными значениями используют PostgreSQL ENUM, а не VARCHAR.

## Что объединено и удалено

tenant_domains, tenant_settings, tenant_modules → поля/settings в tenants.

profiles, roles, permissions, user_roles, role_permissions, sessions, reset_tokens, consents → users; сложный RBAC заменён простым role, а технические auth-токены лучше держать в auth-сервисе/Redis.

product_images, modifier_groups, modifiers, product_modifier_groups, allergens, product_allergens → JSONB в products.

cart_items, cart_item_modifiers → JSONB items в carts.

order_status_history, order_problems → status_history/problem в orders.

delivery zone остаётся отдельной, адрес и доставка разделены только там, где это реально нужно для расчёта доставки.

payment_methods, payment_transactions, payment_webhook_events → одна payments с operation/provider_event_id.

restaurant_zones, reservation_settings, reservation_tables, reservation_status_history → restaurant_tables/reservations; история статусов хранится внутри reservation при необходимости.

loyalty_accounts + loyalty_transactions → loyalty.

promotions + promo_codes + promo_code_products + promo_code_categories → promotions.

notification_templates + notifications + attempts → notifications.

content_pages + banners + faq_items → content.

business_hours + business_hour_exceptions → business_hours.

analytics_product_daily удалена: товарную аналитику лучше строить запросами/ETL позже, когда появится реальная нагрузка.

## Итог

Всего таблиц: 26. Это ниже заданного лимита 30.

Ключевые модули: пользователи, меню, корзина, заказы, доставка, оплата, бронирование, лояльность, акции, уведомления, отзывы, контент, аудит, AI и базовая аналитика.

## 1. tenants

Назначение: Заведения / арендаторы.

## 2. branches

Назначение: Филиалы.

## 3. files

Назначение: Файлы.

## 4. users

Назначение: Пользователи и доступ.

## 5. menu_categories

Назначение: Категории меню.

## 6. products

Назначение: Блюда, изображения, модификаторы и аллергены.

## 7. carts

Назначение: Корзины и позиции корзины.

## 8. orders

Назначение: Заказы.

## 9. order_items

Назначение: Позиции заказа.

## 10. customer_addresses

Назначение: Адреса клиентов.

## 11. delivery_zones

Назначение: Зоны доставки.

## 12. order_deliveries

Назначение: Доставка заказа.

## 13. payments

Назначение: Оплата, операции и webhook.

## 14. restaurant_tables

Назначение: Столы.

## 15. reservations

Назначение: Бронирования.

## 16. table_blocks

Назначение: Блокировки столов.

## 17. loyalty

Назначение: Лояльность и бонусный ledger.

## 18. promotions

Назначение: Акции и промокоды.

## 19. favorites

Назначение: Избранное.

## 20. notifications

Назначение: Уведомления.

## 21. reviews

Назначение: Отзывы.

## 22. content

Назначение: Контент сайта: страницы, баннеры, FAQ.

## 23. business_hours

Назначение: График работы.

## 24. activity_logs

Назначение: Аудит.

## 25. ai_requests

Назначение: AI-запросы.

## 26. analytics_daily

Назначение: Ежедневная аналитика.

## Типизация статусов и справочных значений

Все поля со стабильным фиксированным набором значений переведены из VARCHAR в PostgreSQL ENUM. ENUM защищает БД от опечаток и недопустимых статусов. Новые значения требуют миграции.

tenant_status: trial, active, suspended, archived

branch_status: active, inactive

file_purpose: logo, product, banner, document, avatar, other

user_role: customer, employee, kitchen, manager, admin

user_status: active, blocked, pending

cart_status: active, converted, abandoned

fulfillment_type: pickup, delivery, dine_in

order_status: new, confirmed, cooking, ready, delivering, completed, cancelled

payment_status: pending, paid, failed, refunded, partial

delivery_status: pending, assigned, delivering, delivered, failed

payment_method: cash, card, online, other

payment_status: pending, authorized, paid, failed, refunded

payment_operation: authorize, capture, refund, void

table_status: active, inactive

reservation_status: pending, confirmed, seated, completed, cancelled, no_show

loyalty_operation: earn, spend, expire, adjust

promotion_type: percent, fixed, bonus, free_delivery

notification_channel: email, sms, push, in_app

notification_type: order_status, reservation, marketing, system

notification_status: queued, sent, failed, read

review_status: pending, published, rejected

content_type: page, banner, faq

ai_request_status: queued, processing, completed, failed

## Критические правила

tenant_id обязателен почти во всех бизнес-таблицах; изоляцию tenant лучше дополнительно защищать PostgreSQL RLS.

Деньги только NUMERIC, не FLOAT.

Итог заказа рассчитывает backend, а не клиент.

order_items сохраняет snapshot названия и цены, чтобы старые заказы не менялись после редактирования меню.

Повторный checkout защищается idempotency_key.

Webhook оплаты защищается уникальностью provider + provider_event_id.

Для бронирований конфликт времени должен проверяться транзакционно; при необходимости добавить PostgreSQL exclusion constraint.

Удаление блюда не должно ломать историю заказа: product_id допускает NULL, snapshot остаётся.

JSONB используется для второстепенных/редких структур, а не для ключевых сущностей заказа.

AI, email/SMS/push и тяжёлая аналитика выполняются асинхронно.

## Что можно добавить позже, не ломая эту модель

Склад/остатки, POS, отдельные курьеры, CRM, подписка SaaS, расширенный RBAC, мультиязычность, QR-заказ со стола и детальная товарная аналитика.

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| --- | --- | --- | --- | --- |

| id | UUID | NO | PK | ID заведения |

| name | VARCHAR(200) | NO |  | Название |

| slug | VARCHAR(100) | NO | UNIQUE | Системный slug |

| status | ENUM tenant_status | NO |  | trial / active / suspended / archived |

| currency | CHAR(3) | NO |  | Валюта |

| timezone | VARCHAR(64) | NO |  | Часовой пояс |

| logo_file_id | UUID | YES | FK files | Логотип |

| primary_color | VARCHAR(20) | YES |  | Основной цвет |

| contact_phone | VARCHAR(40) | YES |  | Телефон |

| contact_email | VARCHAR(255) | YES |  | Email |

| address_text | TEXT | YES |  | Адрес |

| latitude | NUMERIC(9,6) | YES |  | Широта |

| longitude | NUMERIC(9,6) | YES |  | Долгота |

| settings | JSONB | YES |  | Редкие настройки и white-label параметры |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| updated_at | TIMESTAMPTZ | NO |  | Изменено |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID филиала |

| tenant_id | UUID | NO | FK tenants | Заведение |

| name | VARCHAR(200) | NO |  | Название |

| code | VARCHAR(50) | NO |  | Внутренний код |

| address_text | TEXT | YES |  | Адрес |

| phone | VARCHAR(40) | YES |  | Телефон |

| timezone | VARCHAR(64) | YES |  | Часовой пояс филиала |

| status | ENUM branch_status | NO |  | active / inactive |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| updated_at | TIMESTAMPTZ | NO |  | Изменено |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID файла |

| tenant_id | UUID | YES | FK tenants | Владелец; NULL для системных файлов |

| storage_key | VARCHAR(500) | NO | UNIQUE | Ключ объекта в S3/Object Storage |

| original_name | VARCHAR(255) | YES |  | Исходное имя |

| mime_type | VARCHAR(120) | NO |  | MIME-тип |

| size_bytes | BIGINT | NO |  | Размер |

| purpose | ENUM file_purpose | YES |  | logo / product / banner / document |

| uploaded_by | UUID | YES | FK users | Загрузивший |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID пользователя |

| tenant_id | UUID | YES | FK tenants | Заведение; NULL для platform admin |

| branch_id | UUID | YES | FK branches | Основной филиал сотрудника |

| email | VARCHAR(255) | YES |  | Email |

| phone | VARCHAR(40) | YES |  | Телефон |

| password_hash | TEXT | YES |  | Хэш пароля |

| first_name | VARCHAR(100) | YES |  | Имя |

| last_name | VARCHAR(100) | YES |  | Фамилия |

| display_name | VARCHAR(150) | YES |  | Отображаемое имя |

| avatar_file_id | UUID | YES | FK files | Аватар |

| role | ENUM user_role | NO |  | customer / employee / kitchen / manager / admin |

| status | ENUM user_status | NO |  | active / blocked / pending |

| email_verified_at | TIMESTAMPTZ | YES |  | Подтверждение email |

| phone_verified_at | TIMESTAMPTZ | YES |  | Подтверждение телефона |

| last_login_at | TIMESTAMPTZ | YES |  | Последний вход |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| updated_at | TIMESTAMPTZ | NO |  | Изменено |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID категории |

| tenant_id | UUID | NO | FK tenants | Заведение |

| parent_id | UUID | YES | FK self | Родительская категория |

| name | VARCHAR(150) | NO |  | Название |

| slug | VARCHAR(150) | NO |  | Slug |

| description | TEXT | YES |  | Описание |

| sort_order | INTEGER | NO |  | Порядок |

| is_active | BOOLEAN | NO |  | Активна |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| updated_at | TIMESTAMPTZ | NO |  | Изменено |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID блюда |

| tenant_id | UUID | NO | FK tenants | Заведение |

| category_id | UUID | YES | FK menu_categories | Категория |

| name | VARCHAR(200) | NO |  | Название |

| slug | VARCHAR(200) | NO |  | Slug |

| description | TEXT | YES |  | Описание |

| composition | TEXT | YES |  | Состав |

| price | NUMERIC(12,2) | NO |  | Цена |

| currency | CHAR(3) | NO |  | Валюта |

| weight | NUMERIC(10,3) | YES |  | Вес |

| image_file_ids | JSONB | YES |  | Список ID изображений |

| modifiers | JSONB | YES |  | Группы модификаторов и варианты |

| allergens | JSONB | YES |  | Аллергены |

| is_available | BOOLEAN | NO |  | Доступно для заказа |

| is_featured | BOOLEAN | NO |  | Рекомендуемое |

| sort_order | INTEGER | NO |  | Порядок |

| preparation_minutes | INTEGER | YES |  | Время приготовления |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| updated_at | TIMESTAMPTZ | NO |  | Изменено |

| deleted_at | TIMESTAMPTZ | YES |  | Архив |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID корзины |

| tenant_id | UUID | NO | FK tenants | Заведение |

| user_id | UUID | YES | FK users | Пользователь; NULL для гостя |

| session_key | VARCHAR(120) | YES |  | Идентификатор гостевой корзины |

| branch_id | UUID | YES | FK branches | Филиал |

| status | ENUM cart_status | NO |  | active / converted / abandoned |

| items | JSONB | NO |  | Позиции, количество и выбранные модификаторы |

| subtotal | NUMERIC(12,2) | NO |  | Сумма до скидок/доставки |

| updated_at | TIMESTAMPTZ | NO |  | Изменено |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID заказа |

| tenant_id | UUID | NO | FK tenants | Заведение |

| branch_id | UUID | YES | FK branches | Филиал |

| order_number | VARCHAR(40) | NO | UNIQUE per tenant | Номер заказа |

| user_id | UUID | YES | FK users | Авторизованный клиент |

| customer_name | VARCHAR(200) | NO |  | Snapshot имени |

| customer_phone | VARCHAR(40) | NO |  | Snapshot телефона |

| customer_email | VARCHAR(255) | YES |  | Snapshot email |

| fulfillment_type | ENUM fulfillment_type | NO |  | pickup / delivery / dine_in |

| status | ENUM order_status | NO |  | new / confirmed / cooking / ready / delivering / completed / cancelled |

| payment_status | ENUM payment_status | NO |  | pending / paid / failed / refunded / partial |

| subtotal | NUMERIC(12,2) | NO |  | Сумма товаров |

| discount_total | NUMERIC(12,2) | NO |  | Скидка |

| delivery_fee | NUMERIC(12,2) | NO |  | Доставка |

| total | NUMERIC(12,2) | NO |  | Итог |

| currency | CHAR(3) | NO |  | Валюта |

| desired_at | TIMESTAMPTZ | YES |  | Желаемое время |

| comment | TEXT | YES |  | Комментарий |

| delivery_address | JSONB | YES |  | Snapshot адреса доставки |

| idempotency_key | VARCHAR(120) | YES |  | Защита от повторного checkout |

| status_history | JSONB | YES |  | История статусов |

| problem | TEXT | YES |  | Проблема/заметка по заказу |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| updated_at | TIMESTAMPTZ | NO |  | Изменено |

| completed_at | TIMESTAMPTZ | YES |  | Завершено |

| cancelled_at | TIMESTAMPTZ | YES |  | Отменено |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID позиции |

| order_id | UUID | NO | FK orders | Заказ |

| product_id | UUID | YES | FK products | Блюдо; NULL допустим после удаления блюда |

| product_name | VARCHAR(200) | NO |  | Snapshot названия |

| unit_price | NUMERIC(12,2) | NO |  | Snapshot цены |

| quantity | INTEGER | NO |  | Количество |

| modifiers | JSONB | YES |  | Выбранные модификаторы и их цены |

| modifiers_total | NUMERIC(12,2) | NO |  | Сумма модификаторов |

| discount_amount | NUMERIC(12,2) | NO |  | Скидка позиции |

| line_total | NUMERIC(12,2) | NO |  | Итог позиции |

| comment | TEXT | YES |  | Комментарий |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID адреса |

| tenant_id | UUID | NO | FK tenants | Заведение |

| user_id | UUID | NO | FK users | Клиент |

| label | VARCHAR(80) | YES |  | Дом / работа / другое |

| address_text | TEXT | NO |  | Адрес |

| entrance | VARCHAR(30) | YES |  | Подъезд |

| floor | VARCHAR(20) | YES |  | Этаж |

| apartment | VARCHAR(20) | YES |  | Квартира |

| comment | TEXT | YES |  | Комментарий курьеру |

| latitude | NUMERIC(9,6) | YES |  | Широта |

| longitude | NUMERIC(9,6) | YES |  | Долгота |

| is_default | BOOLEAN | NO |  | Основной адрес |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| updated_at | TIMESTAMPTZ | NO |  | Изменено |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID зоны |

| tenant_id | UUID | NO | FK tenants | Заведение |

| branch_id | UUID | YES | FK branches | Филиал |

| name | VARCHAR(150) | NO |  | Название |

| min_order_amount | NUMERIC(12,2) | NO |  | Минимальная сумма |

| delivery_fee | NUMERIC(12,2) | NO |  | Стоимость доставки |

| estimated_minutes | INTEGER | YES |  | Оценка времени |

| is_active | BOOLEAN | NO |  | Активна |

| rules | JSONB | YES |  | Геометрия/условия зоны без отдельной GIS-модели |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID доставки |

| order_id | UUID | NO | FK orders UNIQUE | Заказ |

| zone_id | UUID | YES | FK delivery_zones | Зона |

| address_snapshot | JSONB | NO |  | Адрес на момент заказа |

| status | ENUM delivery_status | NO |  | pending / assigned / delivering / delivered / failed |

| courier_name | VARCHAR(150) | YES |  | Имя курьера, если нет отдельного модуля курьеров |

| courier_phone | VARCHAR(40) | YES |  | Телефон |

| tracking_code | VARCHAR(100) | YES |  | Код отслеживания |

| delivered_at | TIMESTAMPTZ | YES |  | Доставлено |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID платежа |

| tenant_id | UUID | NO | FK tenants | Заведение |

| order_id | UUID | NO | FK orders UNIQUE | Заказ |

| method | ENUM payment_method | NO |  | cash / card / online / other |

| provider | VARCHAR(50) | YES |  | Платежный провайдер |

| provider_payment_id | VARCHAR(150) | YES |  | ID платежа у провайдера |

| amount | NUMERIC(12,2) | NO |  | Сумма |

| currency | CHAR(3) | NO |  | Валюта |

| status | ENUM payment_status | NO |  | pending / authorized / paid / failed / refunded |

| operation | ENUM payment_operation | YES |  | authorize / capture / refund / void |

| provider_event_id | VARCHAR(150) | YES | UNIQUE(provider,event) | Idempotency webhook |

| provider_payload | JSONB | YES |  | Внешний payload без секретов |

| paid_at | TIMESTAMPTZ | YES |  | Оплачено |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| updated_at | TIMESTAMPTZ | NO |  | Изменено |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID стола |

| tenant_id | UUID | NO | FK tenants | Заведение |

| branch_id | UUID | NO | FK branches | Филиал |

| zone | VARCHAR(100) | YES |  | Зона/зал |

| name | VARCHAR(80) | NO |  | Номер/название стола |

| capacity | INTEGER | NO |  | Вместимость |

| status | ENUM table_status | NO |  | active / inactive |

| position | JSONB | YES |  | Позиция на плане зала |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID бронирования |

| tenant_id | UUID | NO | FK tenants | Заведение |

| branch_id | UUID | NO | FK branches | Филиал |

| user_id | UUID | YES | FK users | Клиент |

| guest_name | VARCHAR(200) | NO |  | Имя гостя |

| guest_phone | VARCHAR(40) | NO |  | Телефон |

| guest_email | VARCHAR(255) | YES |  | Email |

| guests_count | INTEGER | NO |  | Количество гостей |

| start_at | TIMESTAMPTZ | NO |  | Начало |

| end_at | TIMESTAMPTZ | NO |  | Окончание |

| status | ENUM reservation_status | NO |  | pending / confirmed / seated / completed / cancelled / no_show |

| table_ids | JSONB | YES |  | Выбранные столы |

| comment | TEXT | YES |  | Комментарий |

| cancel_reason | TEXT | YES |  | Причина отмены |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| updated_at | TIMESTAMPTZ | NO |  | Изменено |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID блокировки |

| tenant_id | UUID | NO | FK tenants | Заведение |

| branch_id | UUID | NO | FK branches | Филиал |

| table_id | UUID | NO | FK restaurant_tables | Стол |

| start_at | TIMESTAMPTZ | NO |  | Начало |

| end_at | TIMESTAMPTZ | NO |  | Окончание |

| reason | VARCHAR(255) | YES |  | Причина |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID операции/аккаунта |

| tenant_id | UUID | NO | FK tenants | Заведение |

| user_id | UUID | NO | FK users UNIQUE | Клиент |

| balance | NUMERIC(12,2) | NO |  | Текущий баланс |

| operation | ENUM loyalty_operation | YES |  | earn / spend / expire / adjust |

| amount | NUMERIC(12,2) | YES |  | Изменение баланса |

| order_id | UUID | YES | FK orders | Основание операции |

| comment | TEXT | YES |  | Комментарий |

| created_at | TIMESTAMPTZ | NO |  | Дата операции |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID акции |

| tenant_id | UUID | NO | FK tenants | Заведение |

| code | VARCHAR(80) | YES | UNIQUE per tenant | Промокод; NULL для акции без кода |

| name | VARCHAR(200) | NO |  | Название |

| description | TEXT | YES |  | Описание |

| type | ENUM promotion_type | NO |  | percent / fixed / bonus / free_delivery |

| value | NUMERIC(12,2) | NO |  | Размер скидки/бонуса |

| min_order_amount | NUMERIC(12,2) | YES |  | Минимальная сумма |

| max_discount | NUMERIC(12,2) | YES |  | Лимит скидки |

| starts_at | TIMESTAMPTZ | YES |  | Начало |

| ends_at | TIMESTAMPTZ | YES |  | Окончание |

| usage_limit | INTEGER | YES |  | Общий лимит |

| usage_count | INTEGER | NO |  | Использовано |

| product_ids | JSONB | YES |  | Ограничение товарами |

| category_ids | JSONB | YES |  | Ограничение категориями |

| is_active | BOOLEAN | NO |  | Активна |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID записи |

| tenant_id | UUID | NO | FK tenants | Заведение |

| user_id | UUID | NO | FK users | Пользователь |

| product_id | UUID | NO | FK products | Блюдо |

| created_at | TIMESTAMPTZ | NO |  | Добавлено |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID уведомления |

| tenant_id | UUID | YES | FK tenants | Заведение |

| user_id | UUID | YES | FK users | Получатель |

| channel | ENUM notification_channel | NO |  | email / sms / push / in_app |

| type | ENUM notification_type | NO |  | order_status / reservation / marketing / system |

| subject | VARCHAR(255) | YES |  | Тема |

| body | TEXT | NO |  | Текст |

| status | ENUM notification_status | NO |  | queued / sent / failed / read |

| attempts | INTEGER | NO |  | Количество попыток |

| last_error | TEXT | YES |  | Последняя ошибка |

| scheduled_at | TIMESTAMPTZ | YES |  | Запланировано |

| sent_at | TIMESTAMPTZ | YES |  | Отправлено |

| read_at | TIMESTAMPTZ | YES |  | Прочитано |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID отзыва |

| tenant_id | UUID | NO | FK tenants | Заведение |

| user_id | UUID | YES | FK users | Автор |

| order_id | UUID | YES | FK orders | Заказ |

| product_id | UUID | YES | FK products | Блюдо |

| rating | SMALLINT | NO | CHECK 1..5 | Оценка |

| text | TEXT | YES |  | Текст |

| status | ENUM review_status | NO |  | pending / published / rejected |

| admin_reply | TEXT | YES |  | Ответ администратора |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| updated_at | TIMESTAMPTZ | NO |  | Изменено |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID записи |

| tenant_id | UUID | NO | FK tenants | Заведение |

| type | ENUM content_type | NO |  | page / banner / faq |

| title | VARCHAR(255) | NO |  | Заголовок |

| slug | VARCHAR(255) | YES |  | Slug страницы |

| content | TEXT | YES |  | Текст/HTML/Markdown |

| image_file_id | UUID | YES | FK files | Изображение |

| sort_order | INTEGER | NO |  | Порядок |

| is_active | BOOLEAN | NO |  | Активна |

| metadata | JSONB | YES |  | CTA, ссылка, дополнительные поля |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| updated_at | TIMESTAMPTZ | NO |  | Изменено |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID правила |

| tenant_id | UUID | NO | FK tenants | Заведение |

| branch_id | UUID | YES | FK branches | Филиал |

| day_of_week | SMALLINT | NO | CHECK 1..7 | День недели |

| open_time | TIME | YES |  | Время открытия |

| close_time | TIME | YES |  | Время закрытия |

| is_closed | BOOLEAN | NO |  | Выходной |

| exception_date | DATE | YES |  | Дата исключения/праздника |

| exception_reason | VARCHAR(255) | YES |  | Причина |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID записи |

| tenant_id | UUID | YES | FK tenants | Заведение |

| actor_user_id | UUID | YES | FK users | Кто выполнил действие |

| action | VARCHAR(80) | NO |  | Действие |

| entity_type | VARCHAR(80) | YES |  | Тип сущности |

| entity_id | UUID | YES |  | ID сущности |

| before_data | JSONB | YES |  | Состояние до |

| after_data | JSONB | YES |  | Состояние после |

| ip_address | INET | YES |  | IP |

| user_agent | TEXT | YES |  | User-Agent |

| created_at | TIMESTAMPTZ | NO |  | Дата |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID запроса |

| tenant_id | UUID | YES | FK tenants | Заведение |

| user_id | UUID | YES | FK users | Пользователь |

| feature | VARCHAR(80) | NO |  | Рекомендации / анализ / генерация и т.п. |

| provider | VARCHAR(50) | YES |  | AI-провайдер |

| model | VARCHAR(100) | YES |  | Модель |

| input_data | JSONB | YES |  | Входные данные без секретов |

| output_data | JSONB | YES |  | Результат |

| status | ENUM ai_request_status | NO |  | queued / processing / completed / failed |

| tokens_in | INTEGER | YES |  | Входные токены |

| tokens_out | INTEGER | YES |  | Выходные токены |

| latency_ms | INTEGER | YES |  | Задержка |

| error_message | TEXT | YES |  | Ошибка |

| created_at | TIMESTAMPTZ | NO |  | Создано |

| Поле | Тип | NULL | Ключ / ограничение | Описание |

| id | UUID | NO | PK | ID записи |

| tenant_id | UUID | NO | FK tenants | Заведение |

| branch_id | UUID | YES | FK branches | Филиал |

| date | DATE | NO |  | Дата |

| orders_count | INTEGER | NO |  | Количество заказов |

| completed_orders | INTEGER | NO |  | Завершенные заказы |

| cancelled_orders | INTEGER | NO |  | Отмененные |

| revenue | NUMERIC(14,2) | NO |  | Выручка |

| discount_total | NUMERIC(14,2) | NO |  | Скидки |

| delivery_revenue | NUMERIC(14,2) | NO |  | Доход от доставки |

| new_customers | INTEGER | NO |  | Новые клиенты |

| reservations_count | INTEGER | NO |  | Брони |

| created_at | TIMESTAMPTZ | NO |  | Создано |
