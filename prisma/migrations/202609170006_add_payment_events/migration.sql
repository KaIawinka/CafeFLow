CREATE TABLE "public"."payment_events" (
  "id" UUID NOT NULL,
  "payment_id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "provider" VARCHAR(50) NOT NULL,
  "event_id" VARCHAR(150) NOT NULL,
  "event_type" VARCHAR(80) NOT NULL,
  "status" "public"."payment_txn_status" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" CHAR(3) NOT NULL,
  "payload_hash" CHAR(64) NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_events_provider_event_id_key" ON "public"."payment_events"("provider", "event_id");
CREATE INDEX "payment_events_payment_created_idx" ON "public"."payment_events"("payment_id", "created_at");
CREATE INDEX "payment_events_tenant_created_idx" ON "public"."payment_events"("tenant_id", "created_at");
ALTER TABLE "public"."payment_events" ADD CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."payment_events" ADD CONSTRAINT "payment_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;