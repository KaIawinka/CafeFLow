-- Add Telegram 2FA fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegram_chat_id" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegram_username" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_fa_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_fa_secret" VARCHAR(255);

-- Create unique constraint for telegram_chat_id
CREATE UNIQUE INDEX IF NOT EXISTS "users_telegram_chat_id_key" ON "users"("telegram_chat_id");

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_telegram_chat_id" ON "users"("telegram_chat_id");

-- Create auth_sessions table
CREATE TABLE IF NOT EXISTS "auth_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "ip_address" INET,
    "user_agent" VARCHAR(500),
    "is_2fa_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_activity" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for token
CREATE UNIQUE INDEX IF NOT EXISTS "auth_sessions_token_key" ON "auth_sessions"("token");

-- Create indexes for auth_sessions
CREATE INDEX IF NOT EXISTS "idx_auth_sessions_user_id" ON "auth_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_auth_sessions_token" ON "auth_sessions"("token");
CREATE INDEX IF NOT EXISTS "idx_auth_sessions_expires_at" ON "auth_sessions"("expires_at");

-- Add foreign key for auth_sessions
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS "verification_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- Create indexes for verification_codes
CREATE INDEX IF NOT EXISTS "idx_verification_codes_user_id" ON "verification_codes"("user_id");
CREATE INDEX IF NOT EXISTS "idx_verification_codes_code" ON "verification_codes"("code");
CREATE INDEX IF NOT EXISTS "idx_verification_codes_expires_at" ON "verification_codes"("expires_at");
CREATE INDEX IF NOT EXISTS "idx_verification_codes_type" ON "verification_codes"("type");

-- Add foreign key for verification_codes
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create login_attempts table
CREATE TABLE IF NOT EXISTS "login_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "ip_address" INET NOT NULL,
    "user_agent" VARCHAR(500),
    "success" BOOLEAN NOT NULL,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- Create indexes for login_attempts
CREATE INDEX IF NOT EXISTS "idx_login_attempts_email" ON "login_attempts"("email");
CREATE INDEX IF NOT EXISTS "idx_login_attempts_ip_address" ON "login_attempts"("ip_address");
CREATE INDEX IF NOT EXISTS "idx_login_attempts_created_at" ON "login_attempts"("created_at");

-- Create telegram_link_codes table
CREATE TABLE IF NOT EXISTS "telegram_link_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "telegram_link_codes_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for code
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_link_codes_code_key" ON "telegram_link_codes"("code");

-- Create indexes for telegram_link_codes
CREATE INDEX IF NOT EXISTS "idx_telegram_link_codes_code" ON "telegram_link_codes"("code");
CREATE INDEX IF NOT EXISTS "idx_telegram_link_codes_user_id" ON "telegram_link_codes"("user_id");
CREATE INDEX IF NOT EXISTS "idx_telegram_link_codes_expires_at" ON "telegram_link_codes"("expires_at");

-- Add comments for documentation
COMMENT ON TABLE "auth_sessions" IS 'Active user sessions with JWT tokens and 2FA verification status';
COMMENT ON TABLE "verification_codes" IS 'One-time codes for 2FA login and Telegram linking';
COMMENT ON TABLE "login_attempts" IS 'Audit log of all login attempts for security and rate limiting';
COMMENT ON TABLE "telegram_link_codes" IS 'One-time codes for securely linking Telegram accounts';

COMMENT ON COLUMN "users"."telegram_chat_id" IS 'Telegram chat ID for 2FA code delivery';
COMMENT ON COLUMN "users"."two_fa_enabled" IS 'Whether 2FA is enabled (mandatory for admins)';
COMMENT ON COLUMN "auth_sessions"."is_2fa_verified" IS 'Whether session has passed 2FA verification';
COMMENT ON COLUMN "verification_codes"."attempts" IS 'Number of verification attempts (max 3)';
