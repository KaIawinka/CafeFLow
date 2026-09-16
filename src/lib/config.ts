const developmentJwtSecret = 'cafeflow-development-only-jwt-secret-change-me';

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }
  return new TextEncoder().encode(developmentJwtSecret);
}

export function getRequiredServerSecret(name: 'ADMIN_SETUP_TOKEN' | 'TELEGRAM_WEBHOOK_SECRET'): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be configured`);
  return value;
}