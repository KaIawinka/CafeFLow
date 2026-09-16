CREATE UNIQUE INDEX "carts_tenant_id_session_key_key"
ON "carts"("tenant_id", "session_key");
