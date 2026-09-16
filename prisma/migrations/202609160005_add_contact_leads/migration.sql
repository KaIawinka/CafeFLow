CREATE TYPE "public"."lead_status" AS ENUM ('new', 'contacted', 'qualified', 'converted', 'rejected');

CREATE TABLE "public"."contact_leads" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(40),
    "company" VARCHAR(200),
    "message" TEXT,
    "status" "public"."lead_status" NOT NULL DEFAULT 'new',
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "contact_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_leads_email_idx" ON "public"."contact_leads"("email");
CREATE INDEX "contact_leads_status_created_at_idx" ON "public"."contact_leads"("status", "created_at");