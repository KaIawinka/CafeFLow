# CafeFlow implementation roadmap

Date: 2026-09-16

## Product direction

CafeFlow is a multi-tenant, white-label restaurant platform for cafes, restaurants, bakeries and coffee shops. Every customer-facing action must have a real server workflow, clear feedback, correct localization and a usable mobile layout. Visual controls without persistence are considered incomplete.

## Delivery rules

- Work in small, reviewable vertical steps.
- Validate each step with the narrowest available check and the production build when relevant.
- Commit and push every completed step.
- Preserve tenant and branch isolation in every business query.
- Keep money calculations on the server using decimal-safe values.
- Prefer explicit state transitions, audit logs and idempotency over optimistic UI-only behavior.
- Do not mark a feature complete until loading, empty, error, success, mobile and translated states are handled.

## Status legend

- **Done**: implemented, validated with lint/build, and pushed to `main`.
- **Partial**: working slice exists, but the complete production workflow is not finished.
- **To do**: not implemented or still only represented by schema/documentation.

## Done

### Admin interaction

- **Done**: admin user search no longer replaces the whole panel on every keystroke.
- **Done**: search requests are debounced and stale requests are aborted.
- **Commit**: `5408951`.

### Profile and account security

- **Done**: authenticated password change with current-password verification and strength validation.
- **Done**: password changes revoke the user's active sessions.
- **Done**: settings API now normalizes UI fields and persists language/timezone.
- **Done**: user JWTs are set through `httpOnly`, `secure`, `sameSite` cookies.
- **Done**: browser session APIs accept the cookie-based session.
- **Commit**: `5206eb8`, `6e47423`.

### Auth sessions and 2FA

- **Done**: login and admin/user 2FA create `auth_sessions` records.
- **Done**: access tokens require an active, non-expired server session.
- **Done**: refresh tokens are stored as SHA-256 hashes.
- **Done**: `/api/auth/refresh` rotates the refresh token and session ID.
- **Done**: logout revokes the server session.
- **Done**: user 2FA `tempSessionId` is a short-lived pending database session.
- **Commit**: `d257614`, `e11fb39`.

### Cart and ordering foundation

- **Done**: guest cart is persisted in `carts` instead of `localStorage`.
- **Done**: cart contents and prices are validated on the server.
- **Done**: cart session uniqueness is enforced per tenant.
- **Done**: order creation is idempotent and protected against duplicate requests.
- **Done**: checkout consumes the server cart, not a client-supplied item list.
- **Done**: cart conversion and order creation are transactional.
- **Done**: order status transitions cannot move backwards.
- **Done**: status history is stored in `orders.status_history`.
- **Commits**: `c021a7b`, `1c4299a`, `806e2fc`, `ea18d94`, `c780fab`, `d4fd795`.

### Reservations

- **Done**: overlapping reservations are protected by a PostgreSQL advisory transaction lock.
- **Done**: `table_blocks` are excluded from availability and creation.
- **Commit**: `1194972`.

### Notifications

- **Done**: staff receive in-app notifications for new orders.
- **Done**: staff and authenticated customers receive order status notifications.
- **Done**: protected notification inbox API supports read and mark-read-all operations.
- **Done**: admin panel and shared header show unread counts with polling.
- **Commits**: `c3cbfbd`, `cef67ce`, `8286ab1`, `0efab17`.

## Partial

- **Partial**: tenant and branch data are stored and used in many queries, but public context still selects the first active tenant and branch. This is not ready for commercial multi-tenant deployment.
- **Partial**: dine-in ordering works end to end. Pickup, delivery, addresses, delivery zones and courier workflows are not connected.
- **Partial**: payment fields exist and orders have payment status, but there is no payment provider, webhook verification or refund lifecycle.
- **Partial**: reservations have server conflict protection, but do not yet apply `business_hours`, branch timezone, waitlist, deposits or automatic no-show handling.
- **Partial**: admin orders, products and reservations can be updated, but the panel is still a prototype without pagination, full CRUD and shift timeline views.
- **Partial**: notifications are currently in-app only. Email, Telegram, SMS and push delivery workers are not complete.
- **Partial**: auth sessions now work for login and refresh, but there is no user-facing active-device/session management screen or cleanup job.
- **Partial**: order money values are persisted in decimal database columns, but route-level calculations still use JavaScript `Number` and must become decimal-safe.

## To do: critical production work

1. **Tenant isolation**
	- Replace first-tenant public lookup with domain/slug/branch context.
	- Enforce tenant and branch scope in every admin and public business query.
	- Add automated cross-tenant access tests and consider PostgreSQL RLS.

2. **Complete ordering channels**
	- Add pickup and delivery checkout.
	- Implement customer addresses, delivery zones, fees, time estimates and courier assignment.
	- Add cancellation rules, problems, retry behavior and customer order history.

3. **Payments**
	- Add cash/card/online checkout choice.
	- Implement provider abstraction, signed webhooks, idempotent events, refunds and reconciliation.

4. **Reservation operations**
	- Apply business hours and branch timezone.
	- Add waitlist, deposits, cancellation policy, no-show and day timeline.

5. **Admin operations**
	- Add pagination and filters for users, orders and reservations.
	- Add complete menu/category CRUD, images, modifiers, allergens, preparation time and schedules.
	- Add kitchen board, shift timeline, branch management, staff permissions and audit viewer.

6. **Customer retention**
	- Implement promotions, loyalty ledger, favorites and reviews with server authorization.
	- Add customer profile order/reservation history and repeat-order flow.

7. **Tenant content and landing**
	- Replace hardcoded landing dishes, prices and contact data with tenant/content records.
	- Replace simulated contact form and `#` CTAs with real routes/API.
	- Add hours, branches, map, promotions, reviews, metadata and structured SEO.
	- Add app-like mobile navigation, fixed cart/order access and touch-first states.

8. **Reliability and release quality**
	- Add automated API, authorization, reservation race and checkout tests.
	- Add session cleanup, login-attempt rate limiting and observability.
	- Add PWA/offline drafts, error boundaries, accessibility checks and deployment smoke tests.

## Database reality

The Prisma schema contains 35 models. The following models now have meaningful runtime workflows: `tenants`, `branches`, `users`, `user_settings`, `products`, `menu_categories`, `restaurant_tables`, `reservations`, `carts`, `orders`, `order_items`, `files`, `notifications`, `auth_sessions`, `verification_codes`, Telegram keys/codes and partial `activity_logs`.

The following models remain schema-first or incomplete: `payments`, `customer_addresses`, `delivery_zones`, `order_deliveries`, `loyalty`, `promotions`, `favorites`, `reviews`, `content`, `business_hours`, `analytics_daily`, `ai_requests`, `access_requests`, `login_attempts`.

## Validation baseline

Every completed implementation step has been checked with `npm run lint` and `npm run build`. Database migrations must be applied in the target environment with:

```powershell
npx prisma migrate deploy
```

The repository currently has no automated test suite. This is a release blocker before broad commercial rollout.
