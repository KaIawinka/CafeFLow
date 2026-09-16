CREATE TYPE "public"."domain_status" AS ENUM ('pending', 'verified', 'disabled');

CREATE TABLE "public"."tenant_domains" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "hostname" VARCHAR(255) NOT NULL,
    "status" "public"."domain_status" NOT NULL DEFAULT 'pending',
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "tenant_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_domains_hostname_key" ON "public"."tenant_domains"("hostname");
CREATE INDEX "tenant_domains_tenant_id_idx" ON "public"."tenant_domains"("tenant_id");
CREATE INDEX "tenant_domains_hostname_status_idx" ON "public"."tenant_domains"("hostname", "status");

ALTER TABLE "public"."tenant_domains"
ADD CONSTRAINT "tenant_domains_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;