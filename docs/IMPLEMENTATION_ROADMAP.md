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

## Current priorities

1. Stabilize admin interaction: search without focus loss, debounce and stale-request protection.
2. Repair authentication boundaries: httpOnly cookies, refresh/revocation, session records, password change and consistent cookie/header handling.
3. Complete tenant and branch context instead of selecting the first active tenant.
4. Make cart, ordering and reservation flows server-authoritative and race-safe.
5. Turn the admin panel into an operational workspace for orders, kitchen, reservations, menu and staff.
6. Expose existing database capabilities: payments, delivery, notifications, promotions, loyalty, reviews, content, hours and analytics.
7. Rebuild the landing and mobile customer experience around tenant content and app-like navigation.
8. Add automated tests, observability, PWA resilience and deployment safeguards.

## Database reality

The Prisma schema contains 35 models. The active application currently uses only a subset: tenants, branches, users, user_settings, products, menu_categories, restaurant_tables, reservations, orders, order_items, files, verification codes, Telegram keys/codes and partial activity logs. Carts, payments, delivery, loyalty, promotions, favorites, notifications, reviews, content, business hours, analytics, AI requests, access requests, login attempts and auth sessions need complete workflows.

## First implementation slice

Fix the admin user search so typing remains stable: keep the current dashboard mounted while a query is in flight, debounce requests, cancel stale requests, and only show the initial loading state when there is no existing data. Then verify lint, build and the actual browser typing flow before committing and pushing.
