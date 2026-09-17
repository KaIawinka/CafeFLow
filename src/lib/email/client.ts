/**
 * Email Client
 * Manages email sending via Resend
 */

import { Resend } from 'resend';
import { logger } from '@/lib/logger';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Default sender email
const FROM_EMAIL = process.env.EMAIL_FROM || 'CaféFlow <noreply@cafeflow.app>';
const APP_NAME = 'CaféFlow';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!resend) {
    logger.warn('Resend not configured. Email not sent.', { to: options.to, subject: options.subject });
    // In development, log the email content
    if (process.env.NODE_ENV === 'development') {
      logger.info('Email content (dev mode)', {
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
    }
    return false;
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      logger.error('Failed to send email', { error: result.error, to: options.to });
      return false;
    }

    logger.info('Email sent successfully', { 
      to: options.to, 
      subject: options.subject,
      id: result.data?.id 
    });
    return true;
  } catch (error) {
    logger.error('Email sending error', error);
    return false;
  }
}

/**
 * Send verification code email
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  firstName: string
): Promise<boolean> {
  const subject = `Подтвердите ваш email - ${APP_NAME}`;
  
  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подтверждение email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🍽 ${APP_NAME}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                Подтвердите ваш email
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Привет, ${firstName}!
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Спасибо за регистрацию в ${APP_NAME}. Для завершения регистрации введите код подтверждения:
              </p>
              
              <!-- Verification Code -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 20px; background-color: #fef3c7; border-radius: 12px;">
                    <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #92400e; font-family: 'Courier New', monospace;">
                      ${code}
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                ⏱ Код действует в течение <strong>10 минут</strong>
              </p>
              
              <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Если вы не регистрировались в ${APP_NAME}, просто проигнорируйте это письмо.
              </p>
              
              <!-- Divider -->
              <div style="margin: 30px 0; height: 1px; background-color: #e5e7eb;"></div>
              
              <!-- Tips -->
              <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px; font-weight: 600;">
                🔐 Советы по безопасности:
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                <li>Никогда не делитесь этим кодом с другими</li>
                <li>Администраторы ${APP_NAME} никогда не попросят ваш код</li>
                <li>Используйте сильный пароль для вашего аккаунта</li>
              </ul>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} ${APP_NAME}. Все права защищены.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Это автоматическое письмо, не отвечайте на него.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
${APP_NAME} - Подтверждение email

Привет, ${firstName}!

Спасибо за регистрацию в ${APP_NAME}.

Ваш код подтверждения: ${code}

Код действует в течение 10 минут.

Если вы не регистрировались в ${APP_NAME}, просто проигнорируйте это письмо.

© ${new Date().getFullYear()} ${APP_NAME}
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  code: string,
  firstName: string
): Promise<boolean> {
  const subject = `Сброс пароля - ${APP_NAME}`;
  
  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Сброс пароля</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🍽 ${APP_NAME}</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                Сброс пароля
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Привет, ${firstName}!
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Вы запросили сброс пароля для вашего аккаунта. Используйте этот код:
              </p>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 20px; background-color: #fef3c7; border-radius: 12px;">
                    <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #92400e; font-family: 'Courier New', monospace;">
                      ${code}
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                ⏱ Код действует в течение <strong>10 минут</strong>
              </p>
              
              <p style="margin: 0 0 20px 0; color: #ef4444; font-size: 14px; line-height: 1.5;">
                ⚠️ Если вы не запрашивали сброс пароля, немедленно проигнорируйте это письмо и свяжитесь с поддержкой.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} ${APP_NAME}. Все права защищены.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
${APP_NAME} - Сброс пароля

Привет, ${firstName}!

Вы запросили сброс пароля для вашего аккаунта.

Ваш код подтверждения: ${code}

Код действует в течение 10 минут.

Если вы не запрашивали сброс пароля, немедленно проигнорируйте это письмо и свяжитесь с поддержкой.

© ${new Date().getFullYear()} ${APP_NAME}
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}
