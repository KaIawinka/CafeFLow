CREATE TYPE "public"."waitlist_status" AS ENUM ('waiting', 'notified', 'booked', 'expired', 'cancelled');

CREATE TABLE "public"."reservation_waitlist" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "guest_name" VARCHAR(200) NOT NULL,
    "guest_phone" VARCHAR(40) NOT NULL,
    "guests_count" INTEGER NOT NULL,
    "desired_date" DATE NOT NULL,
    "desired_time" VARCHAR(5) NOT NULL,
    "status" "public"."waitlist_status" NOT NULL DEFAULT 'waiting',
    "guest_token" VARCHAR(120) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "reservation_waitlist_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reservation_waitlist_scope_idx" ON "public"."reservation_waitlist"("tenant_id", "branch_id", "desired_date", "desired_time", "status");
CREATE UNIQUE INDEX "reservation_waitlist_guest_token_key" ON "public"."reservation_waitlist"("guest_token");
ALTER TABLE "public"."reservation_waitlist" ADD CONSTRAINT "reservation_waitlist_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."reservation_waitlist" ADD CONSTRAINT "reservation_waitlist_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;