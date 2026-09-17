ALTER TABLE "public"."order_deliveries"
  ADD COLUMN "courier_user_id" UUID,
  ADD COLUMN "promised_at" TIMESTAMPTZ(6),
  ADD COLUMN "assigned_at" TIMESTAMPTZ(6),
  ADD COLUMN "picked_up_at" TIMESTAMPTZ(6),
  ADD COLUMN "failed_at" TIMESTAMPTZ(6),
  ADD COLUMN "failure_reason" VARCHAR(500),
  ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "public"."order_delivery_events" (
  "id" UUID NOT NULL,
  "delivery_id" UUID NOT NULL,
  "from_status" "public"."delivery_status",
  "to_status" "public"."delivery_status" NOT NULL,
  "actor_user_id" UUID,
  "reason" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_delivery_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_deliveries_courier_status_idx" ON "public"."order_deliveries"("courier_user_id", "status");
CREATE INDEX "order_delivery_events_delivery_created_idx" ON "public"."order_delivery_events"("delivery_id", "created_at");
CREATE INDEX "order_delivery_events_actor_idx" ON "public"."order_delivery_events"("actor_user_id");
ALTER TABLE "public"."order_deliveries" ADD CONSTRAINT "order_deliveries_courier_user_id_fkey" FOREIGN KEY ("courier_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."order_delivery_events" ADD CONSTRAINT "order_delivery_events_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."order_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."order_delivery_events" ADD CONSTRAINT "order_delivery_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;