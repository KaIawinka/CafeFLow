CREATE TYPE "public"."branch_membership_status" AS ENUM ('active', 'suspended', 'revoked');
CREATE TYPE "public"."branch_capability" AS ENUM ('view_orders', 'manage_orders', 'manage_menu', 'manage_reservations', 'manage_staff', 'manage_settings', 'manage_payments', 'manage_domains', 'view_audit');

CREATE TABLE "public"."branch_memberships" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "public"."branch_membership_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "branch_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."branch_membership_capabilities" (
    "id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "capability" "public"."branch_capability" NOT NULL,
    CONSTRAINT "branch_membership_capabilities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "branch_memberships_user_id_branch_id_key" ON "public"."branch_memberships"("user_id", "branch_id");
CREATE INDEX "branch_memberships_scope_idx" ON "public"."branch_memberships"("tenant_id", "branch_id", "status");
CREATE INDEX "branch_memberships_user_status_idx" ON "public"."branch_memberships"("user_id", "status");
CREATE UNIQUE INDEX "branch_membership_capabilities_membership_id_capability_key" ON "public"."branch_membership_capabilities"("membership_id", "capability");
CREATE INDEX "branch_membership_capabilities_capability_idx" ON "public"."branch_membership_capabilities"("capability");

ALTER TABLE "public"."branch_memberships" ADD CONSTRAINT "branch_memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."branch_memberships" ADD CONSTRAINT "branch_memberships_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."branch_memberships" ADD CONSTRAINT "branch_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."branch_membership_capabilities" ADD CONSTRAINT "branch_membership_capabilities_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."branch_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "public"."branch_memberships" ("id", "tenant_id", "branch_id", "user_id", "status", "created_at", "updated_at")
SELECT gen_random_uuid(), "tenant_id", "branch_id", "id", 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "public"."users"
WHERE "tenant_id" IS NOT NULL AND "branch_id" IS NOT NULL AND "role" IN ('employee', 'kitchen', 'manager', 'admin')
ON CONFLICT ("user_id", "branch_id") DO NOTHING;

INSERT INTO "public"."branch_membership_capabilities" ("id", "membership_id", "capability")
SELECT gen_random_uuid(), bm."id", capability::"public"."branch_capability"
FROM "public"."branch_memberships" bm
JOIN "public"."users" u ON u."id" = bm."user_id"
JOIN unnest(ARRAY[
  CASE WHEN u."role" IN ('employee', 'kitchen', 'manager', 'admin') THEN 'view_orders' END,
  CASE WHEN u."role" IN ('employee', 'kitchen', 'manager', 'admin') THEN 'manage_orders' END,
  CASE WHEN u."role" IN ('manager', 'admin') THEN 'manage_menu' END,
  CASE WHEN u."role" IN ('manager', 'admin') THEN 'manage_reservations' END,
  CASE WHEN u."role" IN ('manager', 'admin') THEN 'manage_staff' END,
  CASE WHEN u."role" = 'admin' THEN 'manage_settings' END,
  CASE WHEN u."role" IN ('manager', 'admin') THEN 'manage_payments' END,
  CASE WHEN u."role" = 'admin' THEN 'manage_domains' END,
  CASE WHEN u."role" = 'admin' THEN 'view_audit' END
]) capability ON capability IS NOT NULL
ON CONFLICT ("membership_id", "capability") DO NOTHING;