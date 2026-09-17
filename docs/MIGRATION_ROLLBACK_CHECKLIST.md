# Tenant/Branch Constraint Migration Checklist

Migration: `202609170003_add_tenant_branch_constraints`

## Before deploy

- Create and verify a PostgreSQL backup.
- Confirm the application is running the matching Prisma schema.
- Run the migration preflight in a staging database first.
- Confirm there are no tenant/branch mismatch exceptions.

## Deploy

- Apply with `npx prisma migrate deploy`.
- Check that `branches_id_tenant_id_key` exists.
- Check all `*_tenant_branch_fkey` constraints in `pg_constraint`.
- Run tenant A/tenant B and branch A/branch B authorization smoke tests.

## Rollback

- Stop writes to affected branch-scoped tables.
- Restore the verified backup, or execute a reviewed reverse migration in staging first.
- Re-run Prisma schema validation and the isolation smoke tests.
- Do not drop composite constraints in production without confirming replacement constraints are active.