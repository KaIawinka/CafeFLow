ALTER TABLE "public"."tenant_domains" ADD COLUMN IF NOT EXISTS "verification_token" VARCHAR(120);

UPDATE "public"."tenant_domains"
SET "verification_token" = replace(gen_random_uuid()::text, '-', '')
WHERE "verification_token" IS NULL;

ALTER TABLE "public"."tenant_domains" ALTER COLUMN "verification_token" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_domains_verification_token_key" ON "public"."tenant_domains"("verification_token");