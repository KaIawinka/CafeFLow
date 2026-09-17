ALTER TABLE "public"."order_deliveries"
  ADD COLUMN "retry_count" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "public"."order_deliveries"
  ADD CONSTRAINT "order_deliveries_retry_count_nonnegative"
  CHECK ("retry_count" >= 0);