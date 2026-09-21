/**
 * Password Hashing and Verification
 * Using bcrypt for secure password handling
 */

import bcrypt from 'bcrypt';
import { logger } from '@/lib/logger';

// Salt rounds for bcrypt (higher = more secure but slower)
const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  return hash;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    logger.error('Password verification error', error);
    return false;
  }
}

export type PasswordStrengthErrorKey =
  | 'passwordMinLength'
  | 'passwordUppercase'
  | 'passwordLowercase'
  | 'passwordDigit'
  | 'passwordSpecial';

const passwordStrengthMessages: Record<PasswordStrengthErrorKey, string> = {
  passwordMinLength: 'Пароль должен содержать минимум 8 символов',
  passwordUppercase: 'Пароль должен содержать хотя бы одну заглавную букву',
  passwordLowercase: 'Пароль должен содержать хотя бы одну строчную букву',
  passwordDigit: 'Пароль должен содержать хотя бы одну цифру',
  passwordSpecial: 'Пароль должен содержать хотя бы один специальный символ',
};

export function getPasswordStrengthErrorKeys(password: string): PasswordStrengthErrorKey[] {
  const errors: PasswordStrengthErrorKey[] = [];

  if (password.length < 8) errors.push('passwordMinLength');
  if (!/[A-Z]/.test(password)) errors.push('passwordUppercase');
  if (!/[a-z]/.test(password)) errors.push('passwordLowercase');
  if (!/[0-9]/.test(password)) errors.push('passwordDigit');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('passwordSpecial');

  return errors;
}

/**
 * Validate password strength
 * Returns array of error messages (empty if valid)
 */
export function validatePasswordStrength(password: string): string[] {
  return getPasswordStrengthErrorKeys(password).map((key) => passwordStrengthMessages[key]);
}

/**
 * Check if password is strong enough
 */
export function isPasswordStrong(password: string): boolean {
  return validatePasswordStrength(password).length === 0;
}

/**
 * Generate a random secure password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Ensure at least one character from each category
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
