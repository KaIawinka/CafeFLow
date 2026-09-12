-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."access_request_status" AS ENUM ('pending', 'approved', 'rejected', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."ai_request_status" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "public"."branch_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "public"."cart_status" AS ENUM ('active', 'converted', 'abandoned');

-- CreateEnum
CREATE TYPE "public"."content_type" AS ENUM ('page', 'banner', 'faq');

-- CreateEnum
CREATE TYPE "public"."delivery_status" AS ENUM ('pending', 'assigned', 'delivering', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "public"."file_purpose" AS ENUM ('logo', 'product', 'banner', 'document', 'avatar', 'other');

-- CreateEnum
CREATE TYPE "public"."fulfillment_type" AS ENUM ('pickup', 'delivery', 'dine_in');

-- CreateEnum
CREATE TYPE "public"."loyalty_operation" AS ENUM ('earn', 'spend', 'expire', 'adjust');

-- CreateEnum
CREATE TYPE "public"."notification_channel" AS ENUM ('email', 'sms', 'push', 'in_app');

-- CreateEnum
CREATE TYPE "public"."notification_status" AS ENUM ('queued', 'sent', 'failed', 'read');

-- CreateEnum
CREATE TYPE "public"."notification_type" AS ENUM ('order_status', 'reservation', 'marketing', 'system');

-- CreateEnum
CREATE TYPE "public"."order_payment_status" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partial');

-- CreateEnum
CREATE TYPE "public"."order_status" AS ENUM ('new', 'confirmed', 'cooking', 'ready', 'delivering', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."payment_method" AS ENUM ('cash', 'card', 'online', 'other');

-- CreateEnum
CREATE TYPE "public"."payment_operation" AS ENUM ('authorize', 'capture', 'refund', 'void');

-- CreateEnum
CREATE TYPE "public"."payment_txn_status" AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "public"."promotion_type" AS ENUM ('percent', 'fixed', 'bonus', 'free_delivery');

-- CreateEnum
CREATE TYPE "public"."reservation_status" AS ENUM ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "public"."review_status" AS ENUM ('pending', 'published', 'rejected');

-- CreateEnum
CREATE TYPE "public"."table_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "public"."tenant_status" AS ENUM ('trial', 'active', 'suspended', 'archived');

-- CreateEnum
CREATE TYPE "public"."user_role" AS ENUM ('guest', 'customer', 'employee', 'kitchen', 'manager', 'admin');

-- CreateEnum
CREATE TYPE "public"."user_status" AS ENUM ('active', 'blocked', 'pending');

-- CreateTable
CREATE TABLE "public"."access_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "request_token" VARCHAR(100) NOT NULL,
    "status" "public"."access_request_status" NOT NULL DEFAULT 'pending',
    "ip_address" INET,
    "user_agent" VARCHAR(500),
    "device_info" JSONB,
    "location" VARCHAR(200),
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "rejection_reason" VARCHAR(255),
    "session_token" VARCHAR(500),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "actor_user_id" UUID,
    "action" VARCHAR(80) NOT NULL,
    "entity_type" VARCHAR(80),
    "entity_id" UUID,
    "before_data" JSONB,
    "after_data" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "user_id" UUID,
    "feature" VARCHAR(80) NOT NULL,
    "provider" VARCHAR(50),
    "model" VARCHAR(100),
    "input_data" JSONB,
    "output_data" JSONB,
    "status" "public"."ai_request_status" NOT NULL,
    "tokens_in" INTEGER,
    "tokens_out" INTEGER,
    "latency_ms" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics_daily" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID,
    "date" DATE NOT NULL,
    "orders_count" INTEGER NOT NULL,
    "completed_orders" INTEGER NOT NULL,
    "cancelled_orders" INTEGER NOT NULL,
    "revenue" DECIMAL(14,2) NOT NULL,
    "discount_total" DECIMAL(14,2) NOT NULL,
    "delivery_revenue" DECIMAL(14,2) NOT NULL,
    "new_customers" INTEGER NOT NULL,
    "reservations_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auth_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "ip_address" INET,
    "user_agent" VARCHAR(500),
    "is_2fa_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_activity" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bot_access_keys" (
    "id" UUID NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "key_type" VARCHAR(20) NOT NULL,
    "description" VARCHAR(255),
    "max_uses" INTEGER,
    "uses_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bot_access_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bot_key_activations" (
    "id" UUID NOT NULL,
    "key_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "telegram_chat_id" VARCHAR(100) NOT NULL,
    "activated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_key_activations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."branches" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "address_text" TEXT,
    "phone" VARCHAR(40),
    "timezone" VARCHAR(64),
    "status" "public"."branch_status" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."business_hours" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID,
    "day_of_week" SMALLINT NOT NULL,
    "open_time" TIME(6),
    "close_time" TIME(6),
    "is_closed" BOOLEAN NOT NULL,
    "exception_date" DATE,
    "exception_reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."carts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "session_key" VARCHAR(120),
    "branch_id" UUID,
    "status" "public"."cart_status" NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."content" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" "public"."content_type" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255),
    "content" TEXT,
    "image_file_id" UUID,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_addresses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(80),
    "address_text" TEXT NOT NULL,
    "entrance" VARCHAR(30),
    "floor" VARCHAR(20),
    "apartment" VARCHAR(20),
    "comment" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "is_default" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."delivery_zones" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID,
    "name" VARCHAR(150) NOT NULL,
    "min_order_amount" DECIMAL(12,2) NOT NULL,
    "delivery_fee" DECIMAL(12,2) NOT NULL,
    "estimated_minutes" INTEGER,
    "is_active" BOOLEAN NOT NULL,
    "rules" JSONB,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."favorites" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."files" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "storage_key" VARCHAR(500) NOT NULL,
    "original_name" VARCHAR(255),
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "purpose" "public"."file_purpose",
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."login_attempts" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "ip_address" INET NOT NULL,
    "user_agent" VARCHAR(500),
    "success" BOOLEAN NOT NULL,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usersId" UUID,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loyalty" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "operation" "public"."loyalty_operation",
    "amount" DECIMAL(12,2),
    "order_id" UUID,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "user_id" UUID,
    "channel" "public"."notification_channel" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "subject" VARCHAR(255),
    "body" TEXT NOT NULL,
    "status" "public"."notification_status" NOT NULL,
    "attempts" INTEGER NOT NULL,
    "last_error" TEXT,
    "scheduled_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_deliveries" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "zone_id" UUID,
    "address_snapshot" JSONB NOT NULL,
    "status" "public"."delivery_status" NOT NULL,
    "courier_name" VARCHAR(150),
    "courier_phone" VARCHAR(40),
    "tracking_code" VARCHAR(100),
    "delivered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID,
    "product_name" VARCHAR(200) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "modifiers" JSONB,
    "modifiers_total" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,
    "comment" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID,
    "order_number" VARCHAR(40) NOT NULL,
    "user_id" UUID,
    "customer_name" VARCHAR(200) NOT NULL,
    "customer_phone" VARCHAR(40) NOT NULL,
    "customer_email" VARCHAR(255),
    "fulfillment_type" "public"."fulfillment_type" NOT NULL,
    "status" "public"."order_status" NOT NULL,
    "payment_status" "public"."order_payment_status" NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_total" DECIMAL(12,2) NOT NULL,
    "delivery_fee" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "desired_at" TIMESTAMPTZ(6),
    "comment" TEXT,
    "delivery_address" JSONB,
    "idempotency_key" VARCHAR(120),
    "status_history" JSONB,
    "problem" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "method" "public"."payment_method" NOT NULL,
    "provider" VARCHAR(50),
    "provider_payment_id" VARCHAR(150),
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "public"."payment_txn_status" NOT NULL,
    "operation" "public"."payment_operation",
    "provider_event_id" VARCHAR(150),
    "provider_payload" JSONB,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "category_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "composition" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "weight" DECIMAL(10,3),
    "image_file_ids" JSONB,
    "modifiers" JSONB,
    "allergens" JSONB,
    "is_available" BOOLEAN NOT NULL,
    "is_featured" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "preparation_minutes" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."promotions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" VARCHAR(80),
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "public"."promotion_type" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "min_order_amount" DECIMAL(12,2),
    "max_discount" DECIMAL(12,2),
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL,
    "product_ids" JSONB,
    "category_ids" JSONB,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reservations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "user_id" UUID,
    "guest_name" VARCHAR(200) NOT NULL,
    "guest_phone" VARCHAR(40) NOT NULL,
    "guest_email" VARCHAR(255),
    "guests_count" INTEGER NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "public"."reservation_status" NOT NULL,
    "table_ids" JSONB,
    "comment" TEXT,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."restaurant_tables" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "zone" VARCHAR(100),
    "name" VARCHAR(80) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "public"."table_status" NOT NULL,
    "position" JSONB,

    CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "order_id" UUID,
    "product_id" UUID,
    "rating" SMALLINT NOT NULL,
    "text" TEXT,
    "status" "public"."review_status" NOT NULL,
    "admin_reply" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."table_blocks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "table_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."telegram_link_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_link_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tenants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "status" "public"."tenant_status" NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL,
    "logo_file_id" UUID,
    "primary_color" VARCHAR(20),
    "contact_phone" VARCHAR(40),
    "contact_email" VARCHAR(255),
    "address_text" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "settings" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "telegram_notifications" BOOLEAN NOT NULL DEFAULT true,
    "show_online_status" BOOLEAN NOT NULL DEFAULT true,
    "show_phone" BOOLEAN NOT NULL DEFAULT false,
    "show_email" BOOLEAN NOT NULL DEFAULT false,
    "theme" VARCHAR(20) NOT NULL DEFAULT 'light',
    "compact_mode" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "branch_id" UUID,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(40),
    "password_hash" TEXT NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "display_name" VARCHAR(150),
    "avatar_file_id" UUID,
    "bio" TEXT,
    "role" "public"."user_role" NOT NULL DEFAULT 'customer',
    "status" "public"."user_status" NOT NULL DEFAULT 'active',
    "email_verified_at" TIMESTAMPTZ(6),
    "phone_verified_at" TIMESTAMPTZ(6),
    "telegram_chat_id" VARCHAR(100),
    "telegram_username" VARCHAR(100),
    "telegram_activated_with_key" VARCHAR(50),
    "two_fa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_fa_secret" VARCHAR(255),
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "language" VARCHAR(5) NOT NULL DEFAULT 'ru',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Bishkek',
    "last_login_at" TIMESTAMPTZ(6),
    "last_seen_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_requests_created_at_idx" ON "public"."access_requests"("created_at" ASC);

-- CreateIndex
CREATE INDEX "access_requests_expires_at_idx" ON "public"."access_requests"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "access_requests_request_token_idx" ON "public"."access_requests"("request_token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "access_requests_request_token_key" ON "public"."access_requests"("request_token" ASC);

-- CreateIndex
CREATE INDEX "access_requests_status_idx" ON "public"."access_requests"("status" ASC);

-- CreateIndex
CREATE INDEX "access_requests_user_id_idx" ON "public"."access_requests"("user_id" ASC);

-- CreateIndex
CREATE INDEX "activity_logs_actor_user_id_idx" ON "public"."activity_logs"("actor_user_id" ASC);

-- CreateIndex
CREATE INDEX "activity_logs_tenant_id_idx" ON "public"."activity_logs"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "ai_requests_tenant_id_idx" ON "public"."ai_requests"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "ai_requests_user_id_idx" ON "public"."ai_requests"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "analytics_daily_tenant_id_branch_id_date_key" ON "public"."analytics_daily"("tenant_id" ASC, "branch_id" ASC, "date" ASC);

-- CreateIndex
CREATE INDEX "analytics_daily_tenant_id_idx" ON "public"."analytics_daily"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "auth_sessions_expires_at_idx" ON "public"."auth_sessions"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "auth_sessions_token_idx" ON "public"."auth_sessions"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_key" ON "public"."auth_sessions"("token" ASC);

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_idx" ON "public"."auth_sessions"("user_id" ASC);

-- CreateIndex
CREATE INDEX "bot_access_keys_is_active_idx" ON "public"."bot_access_keys"("is_active" ASC);

-- CreateIndex
CREATE INDEX "bot_access_keys_key_idx" ON "public"."bot_access_keys"("key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "bot_access_keys_key_key" ON "public"."bot_access_keys"("key" ASC);

-- CreateIndex
CREATE INDEX "bot_access_keys_key_type_idx" ON "public"."bot_access_keys"("key_type" ASC);

-- CreateIndex
CREATE INDEX "bot_key_activations_key_id_idx" ON "public"."bot_key_activations"("key_id" ASC);

-- CreateIndex
CREATE INDEX "bot_key_activations_user_id_idx" ON "public"."bot_key_activations"("user_id" ASC);

-- CreateIndex
CREATE INDEX "branches_tenant_id_idx" ON "public"."branches"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "business_hours_branch_id_idx" ON "public"."business_hours"("branch_id" ASC);

-- CreateIndex
CREATE INDEX "business_hours_tenant_id_idx" ON "public"."business_hours"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "carts_tenant_id_idx" ON "public"."carts"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "carts_user_id_idx" ON "public"."carts"("user_id" ASC);

-- CreateIndex
CREATE INDEX "content_tenant_id_idx" ON "public"."content"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "customer_addresses_tenant_id_idx" ON "public"."customer_addresses"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "customer_addresses_user_id_idx" ON "public"."customer_addresses"("user_id" ASC);

-- CreateIndex
CREATE INDEX "delivery_zones_branch_id_idx" ON "public"."delivery_zones"("branch_id" ASC);

-- CreateIndex
CREATE INDEX "delivery_zones_tenant_id_idx" ON "public"."delivery_zones"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "favorites_tenant_id_idx" ON "public"."favorites"("tenant_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_product_id_key" ON "public"."favorites"("user_id" ASC, "product_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "files_storage_key_key" ON "public"."files"("storage_key" ASC);

-- CreateIndex
CREATE INDEX "files_tenant_id_idx" ON "public"."files"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "login_attempts_created_at_idx" ON "public"."login_attempts"("created_at" ASC);

-- CreateIndex
CREATE INDEX "login_attempts_email_idx" ON "public"."login_attempts"("email" ASC);

-- CreateIndex
CREATE INDEX "login_attempts_ip_address_idx" ON "public"."login_attempts"("ip_address" ASC);

-- CreateIndex
CREATE INDEX "loyalty_order_id_idx" ON "public"."loyalty"("order_id" ASC);

-- CreateIndex
CREATE INDEX "loyalty_tenant_id_idx" ON "public"."loyalty"("tenant_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_user_id_key" ON "public"."loyalty"("user_id" ASC);

-- CreateIndex
CREATE INDEX "menu_categories_tenant_id_idx" ON "public"."menu_categories"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "notifications_tenant_id_idx" ON "public"."notifications"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "public"."notifications"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "order_deliveries_order_id_key" ON "public"."order_deliveries"("order_id" ASC);

-- CreateIndex
CREATE INDEX "order_deliveries_zone_id_idx" ON "public"."order_deliveries"("zone_id" ASC);

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "public"."order_items"("order_id" ASC);

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "public"."order_items"("product_id" ASC);

-- CreateIndex
CREATE INDEX "orders_branch_id_idx" ON "public"."orders"("branch_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenant_id_order_number_key" ON "public"."orders"("tenant_id" ASC, "order_number" ASC);

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "public"."orders"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "public"."payments"("order_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_provider_event_id_key" ON "public"."payments"("provider" ASC, "provider_event_id" ASC);

-- CreateIndex
CREATE INDEX "payments_tenant_id_idx" ON "public"."payments"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "public"."products"("category_id" ASC);

-- CreateIndex
CREATE INDEX "products_tenant_id_idx" ON "public"."products"("tenant_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "promotions_tenant_id_code_key" ON "public"."promotions"("tenant_id" ASC, "code" ASC);

-- CreateIndex
CREATE INDEX "promotions_tenant_id_idx" ON "public"."promotions"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "reservations_branch_id_idx" ON "public"."reservations"("branch_id" ASC);

-- CreateIndex
CREATE INDEX "reservations_tenant_id_idx" ON "public"."reservations"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "reservations_user_id_idx" ON "public"."reservations"("user_id" ASC);

-- CreateIndex
CREATE INDEX "restaurant_tables_branch_id_idx" ON "public"."restaurant_tables"("branch_id" ASC);

-- CreateIndex
CREATE INDEX "restaurant_tables_tenant_id_idx" ON "public"."restaurant_tables"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "reviews_tenant_id_idx" ON "public"."reviews"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "settings_key_idx" ON "public"."settings"("key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "public"."settings"("key" ASC);

-- CreateIndex
CREATE INDEX "table_blocks_branch_id_idx" ON "public"."table_blocks"("branch_id" ASC);

-- CreateIndex
CREATE INDEX "table_blocks_table_id_idx" ON "public"."table_blocks"("table_id" ASC);

-- CreateIndex
CREATE INDEX "table_blocks_tenant_id_idx" ON "public"."table_blocks"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "telegram_link_codes_code_idx" ON "public"."telegram_link_codes"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_link_codes_code_key" ON "public"."telegram_link_codes"("code" ASC);

-- CreateIndex
CREATE INDEX "telegram_link_codes_expires_at_idx" ON "public"."telegram_link_codes"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "telegram_link_codes_user_id_idx" ON "public"."telegram_link_codes"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "public"."tenants"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "public"."user_settings"("user_id" ASC);

-- CreateIndex
CREATE INDEX "users_branch_id_idx" ON "public"."users"("branch_id" ASC);

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role" ASC);

-- CreateIndex
CREATE INDEX "users_status_idx" ON "public"."users"("status" ASC);

-- CreateIndex
CREATE INDEX "users_telegram_chat_id_idx" ON "public"."users"("telegram_chat_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_chat_id_key" ON "public"."users"("telegram_chat_id" ASC);

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "public"."users"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "verification_codes_code_idx" ON "public"."verification_codes"("code" ASC);

-- CreateIndex
CREATE INDEX "verification_codes_expires_at_idx" ON "public"."verification_codes"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "verification_codes_type_idx" ON "public"."verification_codes"("type" ASC);

-- CreateIndex
CREATE INDEX "verification_codes_user_id_idx" ON "public"."verification_codes"("user_id" ASC);

-- AddForeignKey
ALTER TABLE "public"."access_requests" ADD CONSTRAINT "access_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."access_requests" ADD CONSTRAINT "access_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_requests" ADD CONSTRAINT "ai_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_requests" ADD CONSTRAINT "ai_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics_daily" ADD CONSTRAINT "analytics_daily_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics_daily" ADD CONSTRAINT "analytics_daily_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bot_access_keys" ADD CONSTRAINT "bot_access_keys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bot_key_activations" ADD CONSTRAINT "bot_key_activations_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "public"."bot_access_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bot_key_activations" ADD CONSTRAINT "bot_key_activations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branches" ADD CONSTRAINT "branches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."business_hours" ADD CONSTRAINT "business_hours_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."business_hours" ADD CONSTRAINT "business_hours_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content" ADD CONSTRAINT "content_image_file_id_fkey" FOREIGN KEY ("image_file_id") REFERENCES "public"."files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content" ADD CONSTRAINT "content_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_addresses" ADD CONSTRAINT "customer_addresses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_addresses" ADD CONSTRAINT "customer_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_zones" ADD CONSTRAINT "delivery_zones_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_zones" ADD CONSTRAINT "delivery_zones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."files" ADD CONSTRAINT "files_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."files" ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."login_attempts" ADD CONSTRAINT "login_attempts_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loyalty" ADD CONSTRAINT "loyalty_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loyalty" ADD CONSTRAINT "loyalty_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loyalty" ADD CONSTRAINT "loyalty_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_categories" ADD CONSTRAINT "menu_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_categories" ADD CONSTRAINT "menu_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_deliveries" ADD CONSTRAINT "order_deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_deliveries" ADD CONSTRAINT "order_deliveries_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."delivery_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promotions" ADD CONSTRAINT "promotions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."restaurant_tables" ADD CONSTRAINT "restaurant_tables_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."restaurant_tables" ADD CONSTRAINT "restaurant_tables_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."table_blocks" ADD CONSTRAINT "table_blocks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."table_blocks" ADD CONSTRAINT "table_blocks_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."restaurant_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."table_blocks" ADD CONSTRAINT "table_blocks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tenants" ADD CONSTRAINT "tenants_logo_file_id_fkey" FOREIGN KEY ("logo_file_id") REFERENCES "public"."files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_avatar_file_id_fkey" FOREIGN KEY ("avatar_file_id") REFERENCES "public"."files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_codes" ADD CONSTRAINT "verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

