# CaféFlow product gap analysis

Date: 2026-09-15

## What was reviewed

The comparison used public product pages from OpenTable, GloriaFood and Olo, focusing on guest ordering, reservations, restaurant operations and account recovery. The current repository was then checked against those workflows.

## Already present in CaféFlow

- Localized guest menu with search, categories and cart.
- QR-style dine-in order flow with table number and kitchen comment.
- Guest order status timeline.
- Table cards and reservation form with phone validation.
- Admin protection by role, kitchen and waiter queues.
- Email verification, Telegram 2FA and password recovery.
- Prisma models for orders, payments, products, reservations, tables, notifications, loyalty and promotions.

## Highest-priority gaps

### P0: Server persistence for guest flows

The current guest menu, orders and reservations still use `localStorage`. This means a kitchen device cannot reliably see an order from a guest's phone, data disappears with browser storage, and two devices can disagree about table availability.

Target implementation:

- Persist guest orders in `orders` and `order_items`.
- Use a signed guest order token instead of exposing private user data.
- Persist reservations in `reservations` and validate overlapping time windows on the server.
- Use `restaurant_tables` and `branches` as the source of truth.
- Keep local state only as an offline draft, never as the canonical order.

### P0: Operational notifications

Competitor workflows make state changes visible immediately. CaféFlow should notify the guest and staff when an order is accepted, cooking, ready, delivered or cancelled. The existing `notifications` table can support this.

### P1: Reservation operations

Add a waitlist, confirmation deadline, no-show status, optional deposit and a clear day timeline. GloriaFood specifically emphasizes deposits to reduce no-shows; OpenTable emphasizes table optimization, waitlist and restaurant-side table management.

### P1: Payments and checkout

The schema already has `payments`, `order_payment_status` and delivery models, but the guest UI does not offer a real payment method or payment lifecycle. Start with cash/card-on-site and add a provider only after order persistence is server-side.

### P1: Menu administration

The admin currently edits availability and price, but not categories, images, modifiers, allergens, preparation time or item availability schedules. These fields already exist in Prisma and should be exposed through focused CRUD screens.

### P2: Retention and insight

The schema contains loyalty, favorites, promotions, reviews and analytics, but there are no customer-facing or admin workflows for them. Implement loyalty and favorites only after the canonical order flow is stable so balances cannot be manipulated from the browser.

### P2: Mobile and resilience

Restaurant systems are commonly used on phones/tablets and some support offline operation. CaféFlow should become installable as a PWA, add focused loading/error states, and later queue offline drafts for retry.

## Recommended delivery order

1. Server-side order and reservation APIs with overlap validation.
2. Switch guest UI and staff queues from localStorage to those APIs.
3. Add notifications and polling/realtime updates.
4. Complete payment and reservation deposit states.
5. Add menu CRUD, waitlist, loyalty and analytics.
6. Add PWA/offline drafts and integrations.

## Sources

- OpenTable Restaurant Solutions: https://www.opentable.com/restaurant-solutions
- GloriaFood: https://www.gloriafood.com/
- Olo restaurant technology: https://www.olo.com/
