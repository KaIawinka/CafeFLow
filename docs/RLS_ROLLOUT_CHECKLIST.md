# PostgreSQL RLS Rollout Checklist

RLS is not enabled by `202609170004_prepare_row_level_security` until the application can set request context on the same PostgreSQL transaction.

## Required application contract

Every tenant-scoped transaction must execute:

```sql
SELECT set_config('cafeflow.tenant_id', '<tenant uuid>', true);
SELECT set_config('cafeflow.branch_ids', '<comma-separated branch uuids>', true);
```

`SET LOCAL` or `set_config(..., true)` must run before any tenant-scoped read or write. Empty `branch_ids` means tenant-wide access; a populated list limits branch rows.

## Enable sequence

1. Deploy and test the transaction context wrapper in staging.
2. Create `USING` and `WITH CHECK` policies for every table with `tenant_id`.
3. Enable RLS and `FORCE ROW LEVEL SECURITY` in staging.
4. Run cross-tenant, cross-branch, checkout, reservation, webhook and worker smoke tests.
5. Repeat on production during a controlled migration window.

## Rollback

Disable policies only through a reviewed migration after traffic is stopped, or restore the verified database backup. Never bypass RLS from application input or by accepting tenant ids from untrusted headers.