ALTER TABLE "public"."orders" ADD COLUMN "promotion_id" UUID;
CREATE INDEX "orders_promotion_id_idx" ON "public"."orders"("promotion_id");
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;