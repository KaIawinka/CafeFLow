ALTER TYPE "public"."payment_txn_status" ADD VALUE IF NOT EXISTS 'chargeback';
ALTER TABLE "public"."payments"
  ADD COLUMN "captured_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "refunded_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "chargeback_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

UPDATE "public"."payments"
SET "captured_amount" = CASE WHEN "status" IN ('paid', 'refunded') THEN "amount" ELSE 0 END,
    "refunded_amount" = CASE WHEN "status" = 'refunded' THEN "amount" ELSE 0 END;