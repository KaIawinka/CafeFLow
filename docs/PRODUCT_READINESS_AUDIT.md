# CafeFlow: аудит готовности продукта

Дата проверки: 2026-09-16  
Основание: `TZ-CafeFlow.md`, `CafeFlow_BD.md`, `docs/IMPLEMENTATION_ROADMAP.md`, Prisma schema, migrations и текущий runtime-код.

## 1. Итог

CafeFlow уже имеет рабочее ядро MVP: авторизация с серверными сессиями, профиль, смену пароля, tenant slug context, серверную корзину, decimal-safe расчёты, idempotent checkout, защиту конфликтов бронирования, базовую админ-панель, пагинацию users/orders и in-app notifications.

При этом продукт пока нельзя считать готовым к коммерческому multi-tenant production. Главные блокеры:

1. изоляция ограничена `tenant_id`, branch context автоматически выбирает первый филиал, PostgreSQL RLS отсутствует;
2. checkout реализует только `dine_in`, а delivery/pickup/payment остаются без end-to-end workflow;
3. большая часть бизнес-модулей присутствует только в БД, но не в API/UI;
4. отсутствует автоматическая тестовая защита auth, authorization, cross-tenant isolation, checkout и reservation races;
5. отсутствуют worker/retry/observability/recovery-процессы, необходимые для эксплуатации.

Текущий разумный статус: **расширенный MVP для контролируемого пилота одного tenant/branch**, но не готовый SaaS-продукт для свободного подключения заведений.

## 2. Проверенный baseline

Проверено в рабочем дереве:

- `npm run lint` — успешно;
- `npx prisma validate` — успешно;
- Prisma schema — PostgreSQL, 35 моделей по текущему roadmap;
- automated test files и test script в `package.json` не обнаружены;
- миграции создают таблицы для delivery, payments, promotions, loyalty, favorites, reviews, content, business hours, audit и login attempts, но наличие таблицы само по себе не означает готовый workflow;
- PostgreSQL RLS policies в текущих миграциях не обнаружены.

## 3. Матрица состояния roadmap

| Область | Фактический статус | Что подтверждено кодом | Что блокирует Done |
|---|---|---|---|
| Tenant isolation | Partial / critical | tenant slug context; tenant filters в части public/admin API | custom domain, явный branch selection, branch-scoped permissions, cross-tenant tests, RLS |
| Pickup/delivery | Schema-only | enums и модели `customer_addresses`, `delivery_zones`, `order_deliveries` | checkout принимает только `dine_in`; нет API адресов, зон, courier assignment, delivery state machine |
| Payments | Schema-only | `payments`, payment enums, unique provider event index | нет method selection, provider adapter, signed webhook, idempotent event processing, refunds/reconciliation |
| Reservations | Partial | transactional advisory lock, table blocks, conflict check | нет business hours, branch timezone, waitlist, deposits, cancellation policy, no-show job, day timeline |
| Admin panel | Partial | dashboard, user/order pagination, product availability/price update, activity log writes | нет full CRUD, filters, branch management, permissions, audit viewer, images/modifiers/allergens/schedules |
| Retention | Schema-only | модели promotions/loyalty/favorites/reviews | нет server workflows, ledger invariants, eligibility rules, customer history, repeat order |
| Tenant content/landing | Partial / incomplete | tenant settings и DB menu API существуют | landing/contact содержит simulated submit; public context не отдаёт весь content; hardcoded CTA/content остаются |
| Mobile/PWA | Partial | responsive client pages, server cart | нет bottom nav, offline drafts, PWA manifest/service worker, robust loading/error/empty states |
| Notifications | Partial | in-app notification creation/read API, unread polling, Telegram auth/2FA support | нет delivery worker, email/Telegram order delivery, SMS/push, retry state machine and delivery observability |
| Auth operations | Partial | httpOnly cookies, auth sessions, refresh rotation, password session revocation | нет sessions UI/revoke-one, cleanup job, login rate limiting, complete security audit trail |
| Automated tests | Not started | no test runner/script/spec files found | all critical authorization and state invariants unprotected |
| Production readiness | Not started / partial | logger, lint/build baseline, migrations | error tracking, metrics/traces, smoke tests, a11y, backup restore drill, offline handling |

## 4. Ключевые findings по runtime

### 4.1 Tenant и branch isolation

- `src/lib/public-context.ts` разрешает tenant по query/header/default slug, но затем выбирает филиал через `findFirst` по `created_at`. Это не выбор пользователя и не устойчивый branch context.
- В `src/app/api/admin/dashboard/route.ts` `tenantScope` ограничивает запросы tenant, но branch scope отсутствует. Для сотрудника с несколькими филиалами нет проверки разрешённого `branch_id`.
- В той же admin route actor без `tenant_id` может создать tenant прямо из dashboard PATCH. Это удобный bootstrap, но его нужно отделить от обычного tenant administration и покрыть authorization tests.
- В `src/app/api/public/orders/route.ts` GET по `guest_token` не принимает tenant context и не добавляет tenant predicate. Токен случайный и уникальный, но публичный endpoint должен всё равно иметь минимальный scope и rate limit.
- В Prisma relations нет составных foreign keys, которые гарантируют, что `branch_id` принадлежит тому же `tenant_id`, что и order/reservation/table/delivery zone. Сейчас это контролируется приложением.
- RLS не включён. Для SaaS это должен быть второй независимый барьер, а не замена application authorization.

### 4.2 Checkout и ordering

`src/app/api/public/orders/route.ts` принимает имя, телефон, table и comment; создаёт только `fulfillment_type: 'dine_in'`, `payment_status: 'pending'`, `delivery_fee: 0`. Client-side форма в `src/components/cafe/ServerCafeExperience.tsx` также требует столик. Поэтому заявленные server cart и idempotent checkout готовы как foundation, но не как полный order workflow из ТЗ.

Отдельно требуется исправить состояние корзины при смене branch: текущая корзина привязана к tenant и содержит branch id, но public context сам выбирает branch. После явного выбора филиала нужно не допускать checkout корзины в другом branch.

### 4.3 Reservations

Конфликт бронирования защищён advisory transaction lock и `table_blocks`, что является хорошей основой. Но `start_at` строится из строки без явного timezone branch, а проверка доступности не использует `business_hours`. Нет операции отмены/переноса с policy, waitlist, no-show automation и депозитов.

### 4.4 Admin и permissions

Авторизация admin API в основном проверяет роль `admin`/`manager`, а не capability и не branch membership. `user_role` слишком груб для planned staff permissions. В текущем dashboard PATCH есть update user/order/product/tenant, но нет полноценного CRUD и consistent audit transaction для всех операций.

### 4.5 Auth и notification operations

`auth_sessions` реально используется для access/refresh validation, rotation и logout. Но схема `login_attempts` не превращена в rate limiter: login route пишет в logger, а не в устойчивый attempt policy. Нет cleanup job для expired sessions/codes/notifications.

Уведомления создаются как `queued`, но отдельного worker и retry dispatcher в текущем проекте нет. Email client существует, однако это не равно фоновой доставке с idempotency и delivery status.

### 4.6 Landing и content

`src/components/landing/ContactForm.tsx` прямо симулирует отправку через `setTimeout`. Это не реальная контактная форма. Публичная клиентская experience загружает меню из API, но landing content, CTA, hours, branches, promotions, reviews, map и SEO structured data не образуют полноценный tenant-driven workflow.

## 5. Что добавить в базу данных

Текущая схема содержит хороший задел, но перед реализацией модулей нужны следующие изменения.

### Tenant/branch

- `tenant_domains`: hostname, verification status, canonical tenant, TLS/verification metadata;
- branch membership/permissions: отдельная связь staff-to-branch либо нормальный RBAC вместо одного `users.branch_id`;
- составные уникальные ключи и foreign keys для tenant/branch consistency;
- selected branch в session/context, а не неявный `findFirst`.

### Orders/delivery/payments

- явный `order_payment_method`/payment intent lifecycle, если одного payment record недостаточно для partial/refund history;
- `payment_events` или append-only event table с provider, event id, signature verification result, raw payload hash, processed timestamp;
- delivery status history, courier/staff id, pickup time window, promised/delivered timestamps;
- normalized order addresses или строгая версия address snapshot schema;
- cancellation/refund reason and actor.

### Reservations

- waitlist entries;
- reservation status history;
- deposit/payment relation;
- cancellation/no-show policy settings and reminder timestamps;
- exclusion constraint или эквивалентная DB-level защита для временных интервалов, если advisory lock не будет единственным механизмом.

### Operations and audit

- permission/capability tables или branch-scoped role assignments;
- append-only audit event fields: request id, correlation id, actor session, action result, reason;
- notification delivery attempts отдельными записями, если нужны точные retry/reconciliation отчёты;
- idempotency records с scope, request hash, response snapshot и expiry для всех externally retried commands.

## 6. Приоритетный план реализации

### P0: security boundary и эксплуатационный фундамент

1. Ввести единый `TenantContext`/`BranchContext` для admin и public API.
2. Реализовать custom domain mapping и явный branch selection.
3. Проверять tenant + branch + capability в каждом admin query/update.
4. Добавить cross-tenant и cross-branch authorization tests.
5. Включить PostgreSQL RLS для tenant-owned таблиц и написать migration rollback/verification checklist.
6. Добавить login attempt rate limiting, session cleanup и security audit events.
7. Подключить error tracking, structured request logs, correlation id, metrics и health/readiness endpoints.

### P1: коммерческий ordering workflow

1. Разделить pickup/delivery/dine-in checkout.
2. Добавить customer addresses, delivery zones, fee calculation и promised time.
3. Добавить delivery assignment и status transitions.
4. Добавить cash/card/online selection.
5. Реализовать provider adapter, signed webhook, event idempotency, refund и reconciliation.
6. Добавить клиентскую order history и быстрый repeat order.

### P2: reservation и back office

1. Branch timezone и business hours/exceptions.
2. Cancellation policy, deposits, waitlist, reminders, no-show.
3. Day timeline board и reservation pagination/filtering.
4. Полный menu/category CRUD, media upload, modifiers, allergens, schedule availability.
5. Branch management, staff membership/capabilities, order filters and audit viewer.

### P3: retention, content, mobile

1. Promotions с серверной валидацией и decimal-safe discount rules.
2. Append-only loyalty ledger с балансом, concurrency control и reversal.
3. Favorites, reviews moderation, history and repeat flows.
4. Tenant-driven landing/content, contact API, hours, branches, map, promotions, reviews.
5. Mobile bottom navigation, fixed cart/status access, touch-first checkout, PWA/offline drafts.

### P4: notification platform и release quality

1. Notification outbox/worker для email, Telegram, SMS и browser push.
2. Retry policy, backoff, dead-letter state and delivery dashboard.
3. Automated API/integration/e2e tests.
4. Accessibility audit, deployment smoke tests, backup/restore drill and load tests.

## 7. Минимальный тестовый набор для Done

### Authorization

- tenant A не читает и не изменяет данные tenant B;
- branch A не читает и не изменяет branch B при одном tenant;
- manager не назначает admin и не меняет недоступный branch;
- guest token, order id, reservation id и cart session не позволяют расширить scope;
- webhook с неверной подписью не меняет payment/order.

### Concurrency and idempotency

- два одновременных checkout с одним idempotency key создают один order;
- два checkout с одной cart session не конвертируют корзину дважды;
- два одновременных reservation request не занимают один table/time slot;
- повторный payment event не создаёт вторую операцию;
- повторный notification delivery не дублирует message сверх заданной policy.

### State machines

- order status не переходит назад и не перескакивает запрещённые состояния;
- delivery status и payment status согласованы с order status;
- refund не превышает captured amount;
- loyalty balance не становится отрицательным без разрешённого adjustment;
- отмена/утрата депозита соответствует cancellation policy.

### User experience

- loading, empty, error, success и translated states для menu/cart/order/booking/admin;
- mobile viewport и keyboard/touch checkout;
- accessibility: labels, focus order, keyboard operation, contrast, reduced motion;
- PWA install/offline draft/reconnect behavior.

## 8. Production checklist

- secrets только через deployment secret manager; default JWT secret запрещён в production;
- миграции применяются отдельно от application startup, есть проверка schema version;
- backup schedule, restore test, RPO/RTO и ответственный за recovery;
- error tracking с user-safe error messages;
- request id и audit correlation для admin/payment/webhook операций;
- rate limits для login, verification, public order/status, contact form и webhooks;
- health/readiness, database connectivity and worker lag checks;
- smoke test после deploy: login, refresh, cart, checkout, order status, reservation, webhook signature;
- dependency and secret scanning;
- privacy/retention policy для IP, user-agent, addresses, payment payloads и audit records;
- accessibility and localization acceptance before marking a vertical slice Done.

## 9. Решение о статусе проекта

Roadmap следует вести не по наличию Prisma-модели, а по vertical slice:

`schema -> server authorization -> transaction/state machine -> UI -> notifications -> tests -> observability -> migration/deployment check`.

Модель или enum считать «готовыми» нельзя, пока этот путь не закрыт. Ближайшая завершённая веха должна быть **P0 Tenant/Branch Isolation**, потому что delivery, payments, admin filters, content и analytics безопасно строятся только после единого контекста доступа.

## 10. Полный инвентарь текущего проекта

### Страницы и пользовательские поверхности

Текущие маршруты покрывают landing, меню, корзину, заказы, бронирование, регистрацию, login, verify email, forgot/reset password, профиль, настройки, access denied и admin dashboard/login. Отдельных production-поверхностей для кухни, кассира, официанта, курьера, владельца сети, platform admin и onboarding tenant пока нет.

### API-поверхности

- Auth: login, admin login, 2FA, refresh, logout, register, email verification, password reset, session, Telegram link code.
- User: profile, avatar, settings, notifications, password.
- Public: menu, cart, tables, reservations, orders.
- Admin: dashboard, reservations, bot access keys, admin auth.
- Integrations: Telegram setup/webhook, bot activation/validation.

Не представлены API для branches, domains, content, files/menu media, categories, modifiers, allergens, business hours, delivery zones, addresses, payment intents/webhooks/refunds, promotions, loyalty, favorites, reviews, audit viewer, analytics, staff permissions, courier assignment, contact leads и support tickets.

### Библиотеки и инфраструктура

- `src/lib/prisma.ts`: runtime database client;
- `src/lib/auth/*`: JWT/session/password foundation;
- `src/lib/email/*`: Resend email client and verification helpers;
- `src/lib/telegram/*`: bot, handlers, messages and code helpers;
- `src/lib/recaptcha.ts` и `src/hooks/useRecaptcha.ts`: bot protection foundation;
- `src/lib/logger.ts`: console-based structured formatting, но не external error tracking;
- `src/proxy.ts`: locale routing, но не auth/tenant/domain routing;
- `scripts/*`: admin, demo seed, bot commands and Telegram update utilities;
- `public/uploads/avatars`: local filesystem upload path, не production object storage.

### Database and migrations

Prisma schema содержит tenant, branch, users, auth, menu, carts, orders, delivery, payments, reservations, loyalty, promotions, favorites, notifications, reviews, content, business hours, audit, AI and analytics models. Основная миграция создаёт задел почти всех модулей; последующие миграции добавляют guest tokens, order idempotency и cart uniqueness.

Это полезная модель MVP, но текущая database design не доведена до SaaS-grade consistency:

- некоторые бизнес-сущности используют JSONB вместо проверяемых таблиц и constraints;
- `tenant_id` и `branch_id` часто существуют рядом без составного FK;
- `users.email` глобально unique, хотя для white-label tenant product нужно явно решить, глобален ли аккаунт клиента или scoped per tenant;
- `loyalty.user_id` глобально unique, что не соответствует loyalty per tenant;
- `favorites` unique по `(user_id, product_id)`, но не включает tenant;
- `payments` содержит один payment record per order, чего недостаточно для append-only captures/refunds/chargebacks;
- `notifications` смешивает outbox, delivery status и read state в одной таблице;
- `activity_logs` не имеют request/correlation id, result, reason и immutable append-only guarantee;
- `business_hours` хранит время, но runtime не применяет его при бронировании и заказе;
- `delivery_zones.rules` и product JSONB не имеют версии/схемы/валидации;
- local uploads не являются durable storage при serverless deployment.

## 11. Расхождения между документацией и кодом

Документацию нужно привести к единому источнику правды до начала коммерческой разработки.

1. `docs/PRODUCT_GAP_ANALYSIS.md` всё ещё говорит, что guest menu/orders/reservations используют `localStorage`. Текущий cart уже серверный, а order/reservation создаются через API. Нужно обновить документ и отдельно отметить, что order history и reservation management всё ещё неполные.
2. `docs/AUTH_SYSTEM.md` и `docs/AUTH_API_REFERENCE.md` описывают rate limiting, `login_attempts`, session inactivity checks, `last_activity` update и client token storage. Runtime не подтверждает все эти обещания; документация должна отражать implemented/partial status.
3. `README.md` содержит пример `.env.example`, которого нет в tracked files; также описывает `/api/health`, которого среди API routes нет. Это ломает onboarding нового покупателя.
4. `README.md` и auth API docs показывают access/refresh tokens в JSON и `localStorage`, тогда как текущая реализация ставит httpOnly cookies. Примеры нужно заменить на cookie-based contract.
5. `docs/DATABASE_AUTH_TABLES.md` заявляет 30 таблиц, а текущая schema/migrations содержит больше моделей. Нужно выбрать актуальную версию и добавить generated schema inventory.
6. `docs/VERCEL_DEPLOYMENT.md` предлагает пароль `password123` в SQL-примере и ручной first-admin flow. Для коммерческого продукта такие инструкции опасны; нужны onboarding command, secret checks и обязательная смена initial credential.
7. `docs/TELEGRAM_BOT_SETUP.md` содержит сценарии, которые частично обозначены как «будет создано позже». Документ должен разделять deployed webhook, supported commands и future commands.

## 12. Что должен уметь коммерческий продукт

### A. Platform owner / SaaS control plane

Отдельная platform admin зона нужна для продажи продукта нескольким заведениям:

- создание tenant из onboarding wizard;
- trial, subscription, plan limits, suspension, archive;
- custom domain connection and verification;
- tenant owner invitation and recovery;
- feature flags/modules per tenant;
- platform-level support impersonation с явным consent/audit trail;
- billing plan, invoices, failed payment and cancellation;
- platform audit, security alerts and tenant health;
- data export, tenant deletion and retention policy.

### B. Tenant owner and branch management

- tenant branding: name, logo, favicon, colors, typography, legal/contact data;
- branches: address, map coordinates, phone, timezone, hours, holidays, order channels;
- staff invitations, role templates, branch assignment, suspended users;
- capabilities per role: view orders, change status, edit prices, refunds, reports, staff, settings;
- branch switcher with selected branch persisted safely in session/context;
- QR codes per table and branch;
- import menu from CSV/JSON and export operational data.

### C. Menu and catalog

- category tree, ordering and localized content;
- products with images, gallery, ingredients, nutrition, allergens, VAT/tax, weight/volume;
- modifier groups with required/optional, min/max selection, price delta and availability;
- variants/sizes and branch-specific pricing;
- availability schedules, sold-out toggle, stock/86 item behavior;
- preparation time, kitchen station, printer/display routing;
- draft/publish workflow and change history;
- soft-delete that preserves order snapshots.

### D. Orders and restaurant operations

- dine-in QR order, pickup, scheduled pickup, delivery and optionally phone/manual orders;
- order acceptance SLA, capacity throttling and pause ordering;
- clear state machine: created, accepted, rejected, preparing, ready, handed over, delivering, completed, cancelled, refunded;
- separate kitchen and front-of-house queues;
- order details with modifiers, allergens, notes, customer contacts, timestamps and actor history;
- partial cancellation, item unavailable substitution, refund reason and customer communication;
- receipts/invoices, tax lines, tips, discounts and currency rules;
- customer order tracking by account and secure guest token;
- repeat order only after revalidating current prices, availability and branch.

### E. Delivery and pickup

- address book, map/geocoding, entrance/floor/apartment and delivery instructions;
- delivery zones as polygons or provider-backed geocoding rules, not opaque unchecked JSON only;
- fee by zone, distance, basket amount, time and surge/holiday policy;
- delivery windows and capacity limits;
- courier pool, assignment, acceptance, pickup, failed delivery and return-to-store;
- courier mobile view with only assigned orders and minimal customer data;
- customer ETA and delivery status notifications;
- pickup slots, pickup code, handoff confirmation and missed pickup handling;
- manual override with audit reason.

### F. Payments and finance

- cash on delivery/on pickup, terminal/card-at-counter and online payment;
- payment intent before order confirmation where provider requires it;
- provider abstraction so a tenant can select a supported regional provider;
- signature verification, replay protection and event idempotency;
- authorization/capture/void/refund/partial-refund/chargeback states;
- reconciliation screen comparing provider, orders and internal ledger;
- immutable payment event log and settlement reports;
- no card data stored in CafeFlow; PCI boundary documented;
- double-entry-like money movement ledger for deposits, refunds, fees, discounts and loyalty.

### G. Reservations and table management

- branch timezone-aware slots and DST-safe date handling;
- opening hours, split shifts, holidays and exceptions;
- table map, table combinations, seating duration and turn time;
- capacity optimization instead of only manual table selection;
- pending confirmation deadline, customer reminders and confirmation link;
- cancellation policy, deposits, refund/no-refund rules and no-show;
- waitlist with notification and expiry;
- host timeline/day board with drag/drop guarded by server transaction;
- walk-ins, phone bookings and internal notes;
- reservation history and customer visit history.

### H. Customer relationship and growth

- customer profile with order/reservation history and consent;
- favorites and saved addresses;
- promotion builder: percentage, fixed, free delivery, BOGO, schedule, segment and limits;
- coupon issuance, redemption ledger and anti-abuse rules;
- loyalty ledger with earn/spend/expire/reversal and tenant scope;
- verified reviews tied to completed order/reservation, moderation and reply;
- campaigns through consented email/Telegram/SMS/push;
- abandoned cart and win-back campaigns with frequency caps;
- referral/loyalty rules only after financial invariants are implemented.

### I. Analytics and reporting

- sales, orders, average order value, gross/net revenue, discounts, refunds and tax;
- channel/branch/product/category/modifier performance;
- preparation time, acceptance time, cancellation rate and SLA breaches;
- delivery time, failed deliveries and courier performance;
- table occupancy, covers, no-show and waitlist conversion;
- promotion ROI, repeat rate, retention cohorts and loyalty liability;
- export CSV/Excel and scheduled reports;
- timezone-correct daily aggregation and backfill after late events;
- role-filtered dashboards that never expose another tenant.

### J. Notifications and integrations

- notification preferences by event and channel;
- outbox worker, retry with exponential backoff, dead-letter and delivery attempt history;
- email provider, Telegram bot, SMS provider, browser push;
- templates per tenant and locale with preview/test send;
- POS/accounting/payment/delivery integrations through versioned webhooks/API keys;
- inbound webhook verification, rate limits and replay protection;
- integration health page and last successful sync.

### K. Accessibility, mobile and resilience

- PWA manifest, installability, icons and service worker;
- offline menu cache and draft cart only; no fake offline order success;
- reconnect/retry UX and idempotent command replay;
- mobile bottom navigation, fixed cart/order status and large touch targets;
- keyboard navigation, screen reader labels, focus management, contrast and reduced motion;
- localized dates, money, timezone and validation messages;
- error boundary, skeleton/loading, empty and recovery states for every workflow.

## 13. Архитектурные решения до написания кода

### Multi-tenant boundary

Ввести единый request context:

`request -> trusted host/domain -> tenant -> selected branch -> actor capabilities -> scoped query`.

Нельзя принимать tenant id из произвольного client body. Slug/header/query допустимы только как public discovery inputs, с нормализацией host и проверкой allowed domain. Admin tenant должен приходить из server-side actor membership, а branch из membership/session/query, проверенного сервером.

### State machines

Для order, payment, delivery, reservation, refund, promotion redemption and notification delivery нужны явные transition functions. Каждая transition должна проверять actor capability, source status, invariants, idempotency и писать audit event. UI не должен напрямую задавать произвольный enum status.

### Money and time

Все деньги остаются `NUMERIC/Decimal`, но расчёт должен быть одной server-side pricing service. Все timestamps хранятся в UTC, пользовательские даты интерпретируются в timezone branch. Нельзя строить production slot logic через `new Date("YYYY-MM-DDTHH:mm:ss")` без явного timezone parser.

### Jobs and asynchronous work

Vercel request handlers не должны быть единственным механизмом для email, Telegram, SMS, push, cleanup, analytics aggregation, payment reconciliation и reminders. Нужен outbox + worker/cron architecture с lease, retry, idempotency, dead-letter and monitoring. Для Neon/Vercel заранее выбрать queue provider и описать failure mode.

### File and media storage

Local `public/uploads` подходит только для локальной разработки. Для tenant/product/content media нужен object storage, signed upload URL, MIME/content sniffing, image processing, size limits, antivirus policy, tenant prefix, deletion lifecycle and CDN URL.

## 14. Коммерческие процессы, которых сейчас нет

Покупатель приобретает не только код, поэтому нужны product operations:

- guided tenant onboarding с checklist и demo data;
- setup wizard: branding, branches, hours, menu, payment, delivery, notifications;
- import/migration assistant from spreadsheet or previous system;
- in-app help, searchable documentation and support contact;
- plan limits and feature availability;
- trial expiration and billing lifecycle;
- status page, incident communication and support SLA;
- audit/export/delete tools for customer data;
- legal pages: privacy, terms, cookie consent, marketing consent, refund policy;
- backup/recovery and tenant offboarding procedure;
- seed/demo tenant that never leaks into production public context.

## 15. Рекомендуемый roadmap для серьёзной реализации

### Milestone 0: contract and cleanup

Обновить документацию, устранить contradictory examples, добавить `.env.example`, health/readiness route, test runner, error boundaries, security headers, secret validation и public tenant contract. Не добавлять новые бизнес-модули, пока current contract не определён.

### Milestone 1: secure SaaS foundation

Tenant domains, branch membership, capability model, server context, RLS, composite consistency constraints, audit correlation, session/device management, login rate limit, cleanup jobs, object storage.

### Milestone 2: operational MVP

Full menu CRUD, categories, images, modifiers, availability; order detail/kitchen/FOH queues; pickup/dine-in; customer order history; reliable status transitions and notifications.

### Milestone 3: delivery and payments

Addresses, zones, fees, windows, courier flow; cash/card/online; one regional provider; webhook/event ledger; refund/reconciliation; receipts.

### Milestone 4: reservation product

Business hours, timezone, table map, optimizer, waitlist, deposits, policy, reminders, no-show and timeline.

### Milestone 5: retention and reporting

Promotions, loyalty, favorites, verified reviews, customer CRM, analytics, exports and scheduled reports.

### Milestone 6: mobile and integrations

PWA, offline drafts, push, email/Telegram/SMS worker, POS/accounting/delivery integrations and QR management.

### Milestone 7: SaaS commercialization

Platform admin, onboarding, billing/plans, support, legal/privacy, tenant export/delete, documentation, status page, load testing and launch readiness.

## 16. Definition of Ready / Definition of Done

### Feature is Ready only when

- owner, user roles, branch/tenant scope and failure modes are named;
- database invariants and migration plan are documented;
- API contract and status transitions are specified;
- localization, mobile and accessibility states are designed;
- observability events and retry/idempotency strategy are defined;
- rollback and data migration impact are understood.

### Feature is Done only when

- server workflow works without trusting client totals or status;
- authorization tests cover allowed and denied tenant/branch cases;
- integration test covers transaction and duplicate request;
- loading/error/empty/success states exist in all supported locales;
- audit and notification side effects are reliable;
- metrics/logs/alerts are present;
- migration is applied against a clean database and a representative database;
- production smoke test passes;
- documentation and support instructions match the actual code.

## 17. Final assessment

На 2026-09-16 проект имеет рабочий foundation, но его нельзя продавать как «полную систему управления кафе». Корректное позиционирование сейчас: **демонстрационный/пилотный multi-tenant restaurant foundation с серверной корзиной, базовыми заказами, бронированием и auth**.

Чтобы продавать реальным покупателям, сначала нужно закрыть Milestones 0–3: security boundary, полноценный operational MVP, delivery и payments. Loyalty, AI, marketing и сложная аналитика не должны опережать эти основы: без корректного order/payment ledger они создадут красивый интерфейс поверх неподтверждённых данных.

Главный критерий качества будущего продукта: владелец заведения должен суметь самостоятельно зарегистрировать tenant, подключить домен, настроить филиал, загрузить меню, открыть канал заказа, принять/приготовить/выдать заказ, провести оплату или возврат, обработать бронирование, увидеть отчёт и безопасно получить поддержку. Ни один из этих сценариев не должен требовать ручного SQL, изменения исходного кода или знания внутреннего deployment процесса.

## 18. Источники сравнительного анализа

Для проверки ожиданий от серьёзных ресторанных платформ использованы публичные продуктовые материалы:

- OpenTable Restaurant Solutions: https://www.opentable.com/restaurant-solutions
- Olo Restaurant Technology: https://www.olo.com/
- GloriaFood Restaurant Ordering: https://www.gloriafood.com/

Общие повторяющиеся ожидания рынка: online ordering для нескольких каналов, payments, delivery/dispatch, reservations/waitlist, offline-capable operations, mobile-first staff workflow, analytics, integrations, marketing/loyalty, onboarding and ongoing support. В документе они преобразованы в требования к CafeFlow без копирования чужого интерфейса или текста.
