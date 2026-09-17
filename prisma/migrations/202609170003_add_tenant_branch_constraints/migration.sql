-- Deployment checklist:
-- 1. Take a database backup and run the preflight SELECTs in this migration.
-- 2. Apply with `prisma migrate deploy` during a maintenance window.
-- 3. Verify the composite constraints from pg_constraint and run tenant/branch smoke tests.
-- Rollback: restore the backup or drop the *_tenant_branch_fkey constraints and
-- recreate the original *_branch_id_fkey constraints only after reviewing data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "public"."users" u
    WHERE u."branch_id" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "public"."branches" b WHERE b."id" = u."branch_id" AND b."tenant_id" = u."tenant_id")
  ) THEN RAISE EXCEPTION 'users contains tenant/branch mismatches'; END IF;
  IF EXISTS (
    SELECT 1 FROM "public"."branch_memberships" m
    WHERE NOT EXISTS (SELECT 1 FROM "public"."branches" b WHERE b."id" = m."branch_id" AND b."tenant_id" = m."tenant_id")
  ) THEN RAISE EXCEPTION 'branch_memberships contains tenant/branch mismatches'; END IF;
  IF EXISTS (
    SELECT 1 FROM "public"."carts" c
    WHERE c."branch_id" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "public"."branches" b WHERE b."id" = c."branch_id" AND b."tenant_id" = c."tenant_id")
  ) THEN RAISE EXCEPTION 'carts contains tenant/branch mismatches'; END IF;
  IF EXISTS (
    SELECT 1 FROM "public"."orders" o
    WHERE o."branch_id" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "public"."branches" b WHERE b."id" = o."branch_id" AND b."tenant_id" = o."tenant_id")
  ) THEN RAISE EXCEPTION 'orders contains tenant/branch mismatches'; END IF;
  IF EXISTS (
    SELECT 1 FROM "public"."delivery_zones" z
    WHERE z."branch_id" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "public"."branches" b WHERE b."id" = z."branch_id" AND b."tenant_id" = z."tenant_id")
  ) THEN RAISE EXCEPTION 'delivery_zones contains tenant/branch mismatches'; END IF;
  IF EXISTS (
    SELECT 1 FROM "public"."restaurant_tables" t
    WHERE NOT EXISTS (SELECT 1 FROM "public"."branches" b WHERE b."id" = t."branch_id" AND b."tenant_id" = t."tenant_id")
  ) THEN RAISE EXCEPTION 'restaurant_tables contains tenant/branch mismatches'; END IF;
  IF EXISTS (
    SELECT 1 FROM "public"."reservations" r
    WHERE NOT EXISTS (SELECT 1 FROM "public"."branches" b WHERE b."id" = r."branch_id" AND b."tenant_id" = r."tenant_id")
  ) THEN RAISE EXCEPTION 'reservations contains tenant/branch mismatches'; END IF;
  IF EXISTS (
    SELECT 1 FROM "public"."reservation_waitlist" w
    WHERE NOT EXISTS (SELECT 1 FROM "public"."branches" b WHERE b."id" = w."branch_id" AND b."tenant_id" = w."tenant_id")
  ) THEN RAISE EXCEPTION 'reservation_waitlist contains tenant/branch mismatches'; END IF;
  IF EXISTS (
    SELECT 1 FROM "public"."table_blocks" b
    WHERE NOT EXISTS (SELECT 1 FROM "public"."branches" branch WHERE branch."id" = b."branch_id" AND branch."tenant_id" = b."tenant_id")
  ) THEN RAISE EXCEPTION 'table_blocks contains tenant/branch mismatches'; END IF;
END $$;

CREATE UNIQUE INDEX "branches_id_tenant_id_key" ON "public"."branches"("id", "tenant_id");

ALTER TABLE "public"."users" DROP CONSTRAINT IF EXISTS "users_branch_id_fkey";
ALTER TABLE "public"."branch_memberships" DROP CONSTRAINT IF EXISTS "branch_memberships_branch_id_fkey";
ALTER TABLE "public"."orders" DROP CONSTRAINT IF EXISTS "orders_branch_id_fkey";
ALTER TABLE "public"."delivery_zones" DROP CONSTRAINT IF EXISTS "delivery_zones_branch_id_fkey";
ALTER TABLE "public"."restaurant_tables" DROP CONSTRAINT IF EXISTS "restaurant_tables_branch_id_fkey";
ALTER TABLE "public"."reservations" DROP CONSTRAINT IF EXISTS "reservations_branch_id_fkey";
ALTER TABLE "public"."reservation_waitlist" DROP CONSTRAINT IF EXISTS "reservation_waitlist_branch_id_fkey";
ALTER TABLE "public"."table_blocks" DROP CONSTRAINT IF EXISTS "table_blocks_branch_id_fkey";
ALTER TABLE "public"."business_hours" DROP CONSTRAINT IF EXISTS "business_hours_branch_id_fkey";
ALTER TABLE "public"."analytics_daily" DROP CONSTRAINT IF EXISTS "analytics_daily_branch_id_fkey";

ALTER TABLE "public"."users" ADD CONSTRAINT "users_tenant_branch_fkey" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "public"."branches"("id", "tenant_id") ON DELETE SET NULL ("branch_id") ON UPDATE CASCADE;
ALTER TABLE "public"."branch_memberships" ADD CONSTRAINT "branch_memberships_tenant_branch_fkey" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "public"."branches"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_tenant_branch_fkey" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "public"."branches"("id", "tenant_id") ON DELETE SET NULL ("branch_id") ON UPDATE CASCADE;
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_tenant_branch_fkey" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "public"."branches"("id", "tenant_id") ON DELETE SET NULL ("branch_id") ON UPDATE CASCADE;
ALTER TABLE "public"."delivery_zones" ADD CONSTRAINT "delivery_zones_tenant_branch_fkey" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "public"."branches"("id", "tenant_id") ON DELETE SET NULL ("branch_id") ON UPDATE CASCADE;
ALTER TABLE "public"."restaurant_tables" ADD CONSTRAINT "restaurant_tables_tenant_branch_fkey" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "public"."branches"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_tenant_branch_fkey" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "public"."branches"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."reservation_waitlist" ADD CONSTRAINT "reservation_waitlist_tenant_branch_fkey" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "public"."branches"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."table_blocks" ADD CONSTRAINT "table_blocks_tenant_branch_fkey" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "public"."branches"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."business_hours" ADD CONSTRAINT "business_hours_tenant_branch_fkey" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "public"."branches"("id", "tenant_id") ON DELETE SET NULL ("branch_id") ON UPDATE CASCADE;
ALTER TABLE "public"."analytics_daily" ADD CONSTRAINT "analytics_daily_tenant_branch_fkey" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "public"."branches"("id", "tenant_id") ON DELETE SET NULL ("branch_id") ON UPDATE CASCADE;