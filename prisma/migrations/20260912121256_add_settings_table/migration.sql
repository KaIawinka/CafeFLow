-- AlterTable
ALTER TABLE "auth_sessions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "login_attempts" ADD COLUMN     "usersId" UUID,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "telegram_link_codes" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "verification_codes" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "settings_key_idx" ON "settings"("key");

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_auth_sessions_expires_at" RENAME TO "auth_sessions_expires_at_idx";

-- RenameIndex
ALTER INDEX "idx_auth_sessions_token" RENAME TO "auth_sessions_token_idx";

-- RenameIndex
ALTER INDEX "idx_auth_sessions_user_id" RENAME TO "auth_sessions_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_login_attempts_created_at" RENAME TO "login_attempts_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_login_attempts_email" RENAME TO "login_attempts_email_idx";

-- RenameIndex
ALTER INDEX "idx_login_attempts_ip_address" RENAME TO "login_attempts_ip_address_idx";

-- RenameIndex
ALTER INDEX "idx_telegram_link_codes_code" RENAME TO "telegram_link_codes_code_idx";

-- RenameIndex
ALTER INDEX "idx_telegram_link_codes_expires_at" RENAME TO "telegram_link_codes_expires_at_idx";

-- RenameIndex
ALTER INDEX "idx_telegram_link_codes_user_id" RENAME TO "telegram_link_codes_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_users_email" RENAME TO "users_email_idx";

-- RenameIndex
ALTER INDEX "idx_users_telegram_chat_id" RENAME TO "users_telegram_chat_id_idx";

-- RenameIndex
ALTER INDEX "idx_verification_codes_code" RENAME TO "verification_codes_code_idx";

-- RenameIndex
ALTER INDEX "idx_verification_codes_expires_at" RENAME TO "verification_codes_expires_at_idx";

-- RenameIndex
ALTER INDEX "idx_verification_codes_type" RENAME TO "verification_codes_type_idx";

-- RenameIndex
ALTER INDEX "idx_verification_codes_user_id" RENAME TO "verification_codes_user_id_idx";
