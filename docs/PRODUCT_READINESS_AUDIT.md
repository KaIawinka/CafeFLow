# CafeFlow: аудит готовности продукта

Дата актуализации: 2026-09-17
Проверено: исходный код, Prisma schema, все миграции, документы `TZ-CafeFlow.md`, `CafeFlow_BD.md`, roadmap, история коммитов и runtime-маршруты.

## 1. Итоговое решение

CafeFlow уже является расширенным MVP с рабочим ядром:

- server-side authentication sessions, httpOnly cookies, refresh rotation;
- профиль, смена пароля, email verification, Telegram 2FA;
- tenant slug context, verified custom domains и выбор филиала;
- server cart, Decimal-safe расчёты и idempotent checkout;
- заказы, status transitions, история заказов и repeat order;
- базовые reservations с защитой гонок, business hours и branch timezone;
- базовая admin-панель, pagination, menu APIs и audit viewer API;
- in-app/email notifications с retry worker;
- promotions validation, favorites, reviews, history и repeat-order APIs.

**Коммерческий multi-tenant production пока не готов.** Главные блокеры: отсутствие PostgreSQL RLS и полноценного branch-scoped RBAC, отсутствие полноценного payment lifecycle, delivery operations, loyalty ledger, tenant-driven landing, automated authorization tests, observability и backup/recovery процесса.

Текущий фактический статус: **расширенный MVP для контролируемого пилота; не готовый SaaS для свободного подключения tenants и филиалов.**

## 2. Результаты проверок

- `npm run lint` — успешно.
- `npm test -- --run` — успешно: 1 test file, 3 теста.
- `npx prisma validate` — успешно.
- Чистый `npm run build` — успешно.
- Рабочее дерево после аудита — без изменений.

Первый build в этой проверке упал на повреждённом stale-файле `.next/dev/types/validator.ts`. После очистки только сгенерированной директории `.next` production build прошёл полностью.

Тестовая инфраструктура существует в `package.json`, но фактическое покрытие минимально: найден только `src/lib/orders/status.test.ts`. API, authorization, tenant isolation, reservation race, checkout, payment и notification tests отсутствуют.

## 3. Матрица roadmap

| Область | Статус | Что реально работает | Что ещё не готово |
|---|---|---|---|
| Tenant isolation | Частично, критический риск | tenant slug, verified domain mapping, branch selector, tenant/branch predicates в основных public/admin API | PostgreSQL RLS, составные tenant/branch FK, branch membership/RBAC, полный audit всех admin routes, cross-tenant tests |
| Pickup и delivery | Частично | pickup/delivery checkout, delivery zones, minimum order, fee, desired time, address snapshot | customer address CRUD, courier assignment, status history, promised/delivered timestamps, delivery retry/problem workflow |
| Payments | Частично | cash/card/online selection, admin transitions, HMAC-signed webhook, duplicate event check | provider abstraction/intents, append-only payment events, полноценные refunds, partial captures, reconciliation и settlement reports |
| Reservations | Частично | advisory lock, table blocks, business hours, branch timezone, waitlist creation API, guest cancellation | waitlist matching/notification, deposits, cancellation policy, no-show job, reservation history, day timeline |
| Admin panel | Частично | user/order/reservation pagination, menu/category APIs и UI, payment transitions, audit viewer API, domain API | order filters, branch management, staff permissions, полноценный CRUD UI, media upload, schedules, modifiers/allergens UI, shift timeline |
| Retention | Частично | promotion validation, favorites API, verified reviews API, histories, repeat-order API | promotion redemption in checkout, append-only loyalty ledger, moderation UI, customer-facing retention screens |
| Tenant content и landing | Частично/не готово | menu загружается из БД, contact API сохраняет leads, tenant settings API | tenant content API/UI, часы, map, branches/promotions/reviews on landing, dynamic metadata, JSON-LD, полная замена hardcoded CTA/content |
| Mobile/PWA | Частично | responsive pages, server cart, fixed cart link | bottom navigation, fast order status, touch-first checkout, manifest, service worker, offline drafts, robust loading/error/empty states |
| Notifications | Частично | in-app notifications, email worker, retry attempts, cron processing | Telegram order delivery, SMS, browser push, delivery attempts/dead-letter/status dashboard |
| Auth operations | Частично | active sessions API, single-session revoke, cleanup job, login rate limiting, login attempts table | полноценный devices UI, security activity viewer, единый rate limit для admin login, полный security audit trail |
| Automated tests | Не готово | 3 unit tests order state machine | auth, authorization, cross-tenant, race, checkout, idempotency, notification permission tests |
| Production readiness | Частично | lint/build, health endpoint, security headers, cron configuration, logger | external error tracking, metrics/tracing, smoke tests, accessibility audit, load tests, backup/restore drill, RPO/RTO |

## 4. Подтверждённые реализации

### 4.1 Tenant и branch context

`src/lib/public-context.ts` разрешает tenant через verified hostname, `?tenant`, `x-cafeflow-tenant` или `CAFEFLOW_DEFAULT_TENANT_SLUG`. При нескольких активных филиалах без явного branch context возвращается отсутствие выбранного филиала. Есть public branches endpoint и клиентский branch selector.

Admin dashboard, reservations, payments, menu и основные public flows фильтруют tenant, а где требуется — branch. Domain API создаёт и проверяет TXT verification records.

Но текущая защита остаётся application-level:

- RLS policies отсутствуют во всех миграциях;
- `users.branch_id` не заменяет branch membership и capability model;
- многие модели имеют независимые `tenant_id` и `branch_id` без составного FK;
- не каждый admin/integration route приведён к единому `TenantContext`;
- automated cross-tenant/cross-branch tests отсутствуют.

### 4.2 Заказы, pickup и delivery

`src/app/api/public/orders/route.ts` теперь поддерживает `dine_in`, `pickup` и `delivery`, проверяет server cart, tenant/branch, доступность товаров, delivery zone, minimum subtotal и Decimal-safe fee. В транзакции создаются order, order items, payment и delivery record; cart переводится в `converted`.

Есть public delivery zones endpoint и customer checkout controls. Однако `delivery_address` пока передаётся как JSON snapshot, customer addresses не имеют API, courier хранится строковым полем, а delivery status transitions/history отсутствуют.

### 4.3 Payments

Checkout сохраняет `cash`, `card`, `online` или `other`. Admin payment API поддерживает ручные переходы, а webhook API проверяет HMAC signature, amount/currency и повторный `provider_event_id`.

Это foundation, а не полноценная платёжная система: нет provider adapter, payment intent lifecycle, отдельной таблицы событий, idempotency record с payload hash, refund history, chargeback и reconciliation с провайдером.

### 4.4 Reservations

Reservation create использует PostgreSQL advisory transaction lock, проверяет пересечения и table blocks. Availability/create применяют business hours и timezone филиала. Guest token lookup/cancel tenant-scoped. Есть waitlist create endpoint.

Waitlist пока только записывает заявку. Нет процесса подбора освободившегося времени, уведомления гостя, deposits, cancellation/no-show policies и timeline-доски.

### 4.5 Admin

Готовы базовые admin APIs для dashboard, reservations, menu categories/products, payments, domains и audit viewer. Users, orders и reservations имеют server pagination. Menu UI позволяет создавать категории/блюда и архивировать блюда.

Не завершены branch management, staff capabilities, order filters по датам/статусам/филиалам, images upload, availability schedules, полноценные modifiers/allergens workflows, kitchen/shift timeline и полные translated loading/error/empty states.

### 4.6 Retention

Работают:

- tenant-scoped Decimal-safe promotion validation;
- favorites API с проверкой tenant/product;
- reviews API только для завершённых заказов;
- authenticated order/reservation history;
- server-validated repeat order, который заново проверяет доступность и цены.

Модель `loyalty` пока не является ledger: в ней `user_id` уникален и нет append-only entries, reversal и concurrency control. Promotion validation ещё не означает применение скидки внутри checkout. Moderation UI отсутствует.

### 4.7 Landing и content

Contact API валидирует leads, ограничивает частоту по IP и создаёт `contact_leads`. Menu загружается из БД.

Landing остаётся в основном локализованным статическим контентом. Нет полноценного tenant content workflow для hero/about/hours/map/promotions/reviews, нет structured data JSON-LD. Metadata в locale layout выбирает первый tenant, а не tenant из hostname/context. Поэтому white-label landing не готов.

### 4.8 Mobile и notifications

Страницы responsive, server cart доступна через клиентский интерфейс, есть быстрый переход в корзину. Но manifest/service worker/offline drafts отсутствуют. Нет bottom navigation и полноценной order-status surface.

Notification cron claim-ит queued records, обрабатывает in-app/email и делает ограниченное число retry. Нет Telegram order notifications, SMS, browser push, отдельной delivery-attempt history и dead-letter dashboard.

### 4.9 Auth operations

`auth_sessions` реально используется для access/refresh validation, rotation, logout и idle timeout. `/api/user/sessions` перечисляет активные устройства и позволяет завершить отдельную сессию. Cleanup удаляет expired sessions/codes и старые login attempts. User login использует persistent rate limiting по email/IP.

Остаются gaps: admin login должен использовать тот же rate-limit/audit policy, security activity viewer отсутствует, а документация auth описывает более широкую защиту, чем фактически проверяется в каждом flow.

## 5. Реальность Prisma schema и миграций

Схема содержит 35 моделей и хороший задел: tenants, branches, users, menu, carts, orders, delivery, payments, reservations, waitlist, loyalty, promotions, favorites, reviews, content, business hours, notifications, audit, analytics и auth.

Ключевые ограничения текущей БД:

- нет `CREATE POLICY` и `ENABLE ROW LEVEL SECURITY`;
- `loyalty.user_id @unique` несовместим с append-only loyalty ledger;
- `payments` — один record на order, недостаточно для captures/refunds/chargebacks;
- `order_deliveries` не содержит courier user, status history и delivery event timestamps;
- `customer_addresses` существует только в schema, runtime API отсутствует;
- tenant/branch consistency часто проверяется только кодом;
- `products.modifiers`, `allergens`, `image_file_ids`, `delivery_zones.rules` хранятся в JSON без schema-level validation/versioning;
- `activity_logs` не имеют request id, correlation id, result/reason и immutable guarantee;
- `notifications` смешивает outbox, delivery state и read state;
- local avatar uploads в `public/uploads` не являются надёжным object storage для serverless deployment.

Последние миграции добавили guest tokens, order idempotency, cart uniqueness, tenant domains, contact leads, notification processing и waitlist. Наличие этих таблиц не равно завершённому workflow.

## 6. Что считать Done

Feature считается завершённой только после цепочки:

`schema -> server authorization -> transaction/state machine -> UI -> notifications -> tests -> observability -> migration/deployment check`.

Одна Prisma model, enum, API endpoint или UI-кнопка не является готовой функцией без проверки tenant/branch scope, loading/error/empty/success states и тестов критических инвариантов.

## 7. Приоритеты дальнейшей работы

### P0: security boundary

1. Ввести единые `TenantContext` и `BranchContext` для всех admin/public business queries.
2. Сделать branch membership/capability model вместо одного `users.branch_id`.
3. Добавить составные FK/constraints для tenant + branch consistency.
4. Добавить cross-tenant/cross-branch authorization tests.
5. Включить PostgreSQL RLS и подготовить migration verification/rollback checklist.

### P1: коммерческий ordering и payments

1. Customer addresses, courier assignment и delivery state machine.
2. Payment provider abstraction, payment events, signed webhook idempotency.
3. Refunds, partial captures, chargebacks и reconciliation.
4. Promotion redemption внутри transactional checkout.
5. Order cancellation/problem rules и customer status workflow.

### P2: reservations и back office

1. Waitlist matching/notifications, deposits, cancellation policy, no-show job.
2. Day timeline и reservation filters.
3. Full menu/category CRUD, media, modifiers, allergens, schedules.
4. Branch management, staff permissions, kitchen/shift views.

### P3: retention, content, mobile

1. Append-only loyalty ledger с reversal и concurrency control.
2. Reviews moderation, customer retention UI, promotion redemption.
3. Tenant-driven landing, hours, map, branches, promotions, reviews, metadata и JSON-LD.
4. Bottom navigation, fixed status/cart access, PWA и offline drafts.

### P4: release quality

1. API/integration/e2e tests для auth, authorization, isolation, races, checkout и idempotency.
2. Telegram/SMS/push notification delivery с retry/backoff/dead-letter.
3. External error tracking, request correlation, metrics, worker lag и readiness checks.
4. Accessibility audit, deployment smoke tests, load tests и backup/restore drill.

## 8. Минимальный тестовый набор перед production

### Authorization и isolation

- tenant A не читает и не изменяет tenant B;
- branch A не читает и не изменяет branch B;
- manager не назначает admin и не меняет недоступный branch;
- guest order/reservation token не расширяет tenant scope;
- повторный/подменённый cart session не позволяет checkout чужой корзины;
- неверная webhook signature не меняет payment/order.

### Concurrency и idempotency

- два checkout с одним idempotency key создают один order;
- cart не конвертируется дважды;
- два reservation requests не занимают один table/time slot;
- повторный payment event не создаёт вторую операцию;
- notification retry не дублирует доставку сверх policy.

### State machines

- order status не переходит назад;
- payment/delivery status согласованы с order status;
- refund не превышает captured amount;
- loyalty balance корректно обрабатывает earn/spend/reversal;
- no-show/cancellation/deposit policy применяется транзакционно.

## 9. Production checklist

- RLS и application authorization проверены совместными тестами;
- secrets находятся только в deployment secret manager;
- миграции применяются контролируемо через `prisma migrate deploy`;
- есть backup schedule, restore test, RPO/RTO и ответственный;
- error tracking, request id, correlation id и structured logs подключены;
- worker lag, notification failures и webhook failures наблюдаемы;
- после deploy выполняется smoke test login -> refresh -> cart -> checkout -> status -> reservation -> webhook;
- выполнены accessibility, localization, dependency и secret scanning checks;
- определена retention/privacy policy для IP, user-agent, addresses, payment payloads и audit records.

## 10. Перенесённые правила и история реализации

### 10.1. Выполнено 2026-09-17

- Унифицированы persistent login rate limiting и audit records для admin password login и Telegram 2FA: блокировка по email/IP, журнал успешных и неуспешных попыток, причин отказа и доставки кода. Проверки: ESLint, TypeScript, Vitest и production build.

CafeFlow — multi-tenant white-label платформа. Любое пользовательское действие должно иметь реальный server workflow, понятную обратную связь, локализацию и mobile layout. UI-контрол без persistence не считается завершённым.

Правила реализации:

- работать небольшими reviewable vertical slices;
- проверять каждый шаг узким тестом и production build, если он затронут;
- сохранять tenant и branch isolation во всех business queries;
- выполнять денежные расчёты на сервере через Decimal-safe значения;
- использовать явные state transitions, audit logs и idempotency;
- не считать функцию готовой без loading, empty, error, success, mobile и translated states;
- все завершённые шаги должны иметь commit и проверку перед публикацией.

Статусы в этом документе означают:

- **Готово** — runtime workflow реализован и проверен;
- **Частично** — есть рабочий slice, но отсутствует полный production workflow;
- **Не готово** — функция отсутствует либо представлена только schema/documentation.

Ключевая история завершённых шагов:

| Коммиты | Реализованный шаг |
|---|---|
| `5408951` | responsive admin search, debounce и отмена устаревших запросов |
| `5206eb8`, `6e47423` | профиль, смена пароля, httpOnly auth cookies |
| `d257614`, `e11fb39` | server auth sessions, refresh rotation и 2FA sessions |
| `c021a7b`, `1c4299a`, `806e2fc`, `ea18d94`, `c780fab`, `d4fd795` | server cart, transactional checkout, idempotency и order transitions |
| `1194972` | advisory lock и защита от double booking |
| `8a46c52`, `dcc9cda`, `1ddc10e` | explicit tenant context, custom domains и branch discovery |
| `f7ea04b`, `084034f` | tenant/branch scope в admin и guest flows |
| `c3ba425`, `8155f43`, `96b54d`, `07c047c` | login rate limit, cleanup, session idle timeout и session management API |
| pending | единый login rate limit и security audit для admin password login и Telegram 2FA |
| `20a3356`, `36e48e9` | health/security headers и реальная contact form API |
| `9ec055e`, `9d9faf4`, `f546b13`, `8a0a9bf` | menu/category APIs, admin menu UI и локализация |
| `686e915`, `4e48df3` | pickup/delivery checkout, zones и payment method controls |
| `1c2be8b`, `9b65968`, `2a24496` | business hours, timezone, guest reservation management и waitlist API |
| `43e79bc`, `ca47571`, `0f58a71` | audit viewer API, reservation audit и retryable notification worker |
| `4abee71`, `d89c212` | admin payment transitions и signed payment webhooks |
| `741b7fb`, `01707c6`, `2d16c18`, `740d136` | favorites, reviews, promotions, history и repeat order |
| `4dfc5cf` | первые state-machine tests для order transitions |

## 11. Связь с roadmap

Старая англоязычная версия roadmap удалена после переноса её полезных правил и истории коммитов в раздел 10. Этот аудит является единой актуальной сводкой фактического состояния на 2026-09-17.
