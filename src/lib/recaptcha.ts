/**
 * reCAPTCHA Verification
 * Server-side verification of reCAPTCHA tokens
 */

import { logger } from './logger';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE = 0.5; // Minimum score to pass (0.0 - 1.0, higher is better)

interface RecaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  action?: string;
  'error-codes'?: string[];
}

/**
 * Verify reCAPTCHA token with Google
 */
export async function verifyRecaptcha(token: string, expectedAction?: string): Promise<{
  success: boolean;
  score?: number;
  error?: string;
}> {
  // Skip verification in development if no secret key
  if (!RECAPTCHA_SECRET_KEY) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('reCAPTCHA not configured. Skipping verification in development mode.');
      return { success: true, score: 1.0 };
    }
    logger.error('reCAPTCHA secret key not configured');
    return { success: false, error: 'reCAPTCHA not configured' };
  }

  // Skip verification in development if no token (reCAPTCHA not loaded)
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('reCAPTCHA token missing. Skipping verification in development mode.');
      return { success: true, score: 1.0 };
    }
    return { success: false, error: 'reCAPTCHA token missing' };
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const data: RecaptchaVerifyResponse = await response.json();

    if (!data.success) {
      logger.warn('reCAPTCHA verification failed', { 
        errors: data['error-codes'],
        action: data.action 
      });
      return { 
        success: false, 
        error: 'reCAPTCHA verification failed',
        score: data.score 
      };
    }

    // Check action if provided
    if (expectedAction && data.action !== expectedAction) {
      logger.warn('reCAPTCHA action mismatch', { 
        expected: expectedAction, 
        received: data.action 
      });
      return { 
        success: false, 
        error: 'Invalid reCAPTCHA action',
        score: data.score 
      };
    }

    // Check score
    const score = data.score ?? 0;
    if (score < MIN_SCORE) {
      logger.warn('reCAPTCHA score too low', { 
        score, 
        minScore: MIN_SCORE,
        action: data.action 
      });
      return { 
        success: false, 
        error: 'reCAPTCHA score too low',
        score 
      };
    }

    logger.info('reCAPTCHA verification successful', { 
      score, 
      action: data.action 
    });

    return { success: true, score };

  } catch (error) {
    logger.error('reCAPTCHA verification error', error);
    return { 
      success: false, 
      error: 'reCAPTCHA verification error' 
    };
  }
}

/**
 * Check if reCAPTCHA is enabled
 */
export function isRecaptchaEnabled(): boolean {
  return !!RECAPTCHA_SECRET_KEY && !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
}

/**
 * Get minimum required score
 */
export function getMinScore(): number {
  return MIN_SCORE;
}
