/**
 * Email Verification Utilities
 * Handles verification code generation and validation
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

const CODE_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create and store verification code for user
 */
export async function createVerificationCode(
  userId: string,
  type: 'email_verification' | 'password_reset' | '2fa_login',
  ipAddress?: string
): Promise<string> {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  // Delete any existing unused codes of same type for this user
  await prisma.verification_codes.deleteMany({
    where: {
      user_id: userId,
      type,
      used_at: null,
    },
  });

  // Create new verification code
  await prisma.verification_codes.create({
    data: {
      user_id: userId,
      code,
      type,
      expires_at: expiresAt,
      ip_address: ipAddress || null,
      attempts: 0,
    },
  });

  logger.info('Verification code created', { userId, type, expiresAt });

  return code;
}

/**
 * Verify code and mark as used
 */
export async function verifyCode(
  userId: string,
  code: string,
  type: 'email_verification' | 'password_reset' | '2fa_login'
): Promise<{
  success: boolean;
  error?: string;
  errorKey?: 'verificationCodeInvalid' | 'verificationCodeExpired' | 'verificationAttemptsExceeded';
}> {
  // Find the code
  const verificationCode = await prisma.verification_codes.findFirst({
    where: {
      user_id: userId,
      code,
      type,
      used_at: null,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (!verificationCode) {
    logger.warn('Verification code not found', { userId, type });
    return { success: false, error: 'Неверный код подтверждения', errorKey: 'verificationCodeInvalid' };
  }

  // Check if expired
  if (new Date() > new Date(verificationCode.expires_at)) {
    logger.warn('Verification code expired', { userId, type });
    return { success: false, error: 'Код подтверждения истёк. Запросите новый.', errorKey: 'verificationCodeExpired' };
  }

  // Check attempts
  if (verificationCode.attempts >= MAX_ATTEMPTS) {
    logger.warn('Max verification attempts reached', { userId, type });
    return { success: false, error: 'Превышено количество попыток. Запросите новый код.', errorKey: 'verificationAttemptsExceeded' };
  }

  // Increment attempts
  await prisma.verification_codes.update({
    where: { id: verificationCode.id },
    data: {
      attempts: { increment: 1 },
    },
  });

  // Validate code
  if (verificationCode.code !== code) {
    logger.warn('Invalid verification code', { userId, type, attempts: verificationCode.attempts + 1 });
    return { success: false, error: 'Неверный код подтверждения', errorKey: 'verificationCodeInvalid' };
  }

  // Mark as used
  await prisma.verification_codes.update({
    where: { id: verificationCode.id },
    data: {
      used_at: new Date(),
    },
  });

  logger.info('Verification code used successfully', { userId, type });

  return { success: true };
}

/**
 * Check if user can request new code (rate limiting)
 */
export async function canRequestNewCode(
  userId: string,
  type: string
): Promise<{ canRequest: boolean; waitSeconds?: number }> {
  const recentCode = await prisma.verification_codes.findFirst({
    where: {
      user_id: userId,
      type,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (!recentCode) {
    return { canRequest: true };
  }

  // Allow new code after 1 minute
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  
  if (new Date(recentCode.created_at) > oneMinuteAgo) {
    const waitSeconds = Math.ceil((new Date(recentCode.created_at).getTime() + 60000 - Date.now()) / 1000);
    return { canRequest: false, waitSeconds };
  }

  return { canRequest: true };
}

/**
 * Validate email format and check if it's from a real domain
 */
export async function validateEmailAddress(email: string): Promise<{
  valid: boolean;
  error?: string;
  errorKey?: 'invalidEmailFormat' | 'temporaryEmailNotAllowed' | 'emailDomainSuggestion';
  errorParams?: Record<string, string>;
}> {
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Неверный формат email адреса', errorKey: 'invalidEmailFormat' };
  }

  // Extract domain
  const domain = email.split('@')[1].toLowerCase();

  // List of common disposable email domains (можно расширить)
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
    'mailinator.com', 'temp-mail.org', 'getnada.com', 'fakeinbox.com',
    'trashmail.com', 'yopmail.com', 'maildrop.cc', 'sharklasers.com'
  ];

  if (disposableDomains.includes(domain)) {
    return { valid: false, error: 'Временные email адреса не допускаются', errorKey: 'temporaryEmailNotAllowed' };
  }

  // Check for common typos in popular domains
  const domainSuggestions: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'outlok.com': 'outlook.com',
    'hotmial.com': 'hotmail.com',
  };

  if (domainSuggestions[domain]) {
    return { 
      valid: false, 
      error: `Возможно, вы имели в виду ${email.split('@')[0]}@${domainSuggestions[domain]}?`,
      errorKey: 'emailDomainSuggestion',
      errorParams: { suggestion: `${email.split('@')[0]}@${domainSuggestions[domain]}` },
    };
  }

  // Basic validation passed
  return { valid: true };
}
