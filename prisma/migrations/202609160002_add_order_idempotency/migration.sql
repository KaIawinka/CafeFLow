CREATE UNIQUE INDEX "orders_tenant_id_idempotency_key_key"
ON "orders"("tenant_id", "idempotency_key");
