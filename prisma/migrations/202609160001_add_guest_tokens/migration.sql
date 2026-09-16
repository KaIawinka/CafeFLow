ALTER TABLE "orders" ADD COLUMN "guest_token" VARCHAR(120);
ALTER TABLE "reservations" ADD COLUMN "guest_token" VARCHAR(120);
CREATE UNIQUE INDEX "orders_guest_token_key" ON "orders"("guest_token");
CREATE UNIQUE INDEX "reservations_guest_token_key" ON "reservations"("guest_token");
