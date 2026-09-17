WITH ranked_defaults AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "tenant_id", "user_id"
    ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
  ) AS position
  FROM "public"."customer_addresses"
  WHERE "is_default" = true
)
UPDATE "public"."customer_addresses" address
SET "is_default" = false
FROM ranked_defaults ranked
WHERE address."id" = ranked."id" AND ranked.position > 1;

CREATE UNIQUE INDEX "customer_addresses_one_default_per_user_key"
ON "public"."customer_addresses"("tenant_id", "user_id")
WHERE "is_default" = true;