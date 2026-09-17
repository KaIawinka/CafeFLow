import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Locale } from '@/app/i18n/config';
import { verifyAccessToken } from '@/lib/auth/jwt';

const staffRoles = new Set(['employee', 'kitchen', 'manager', 'admin']);

export async function redirectStaffFromCustomerSurface(locale: Locale) {
  const token = (await cookies()).get('accessToken')?.value;
  if (!token) return;

  const payload = await verifyAccessToken(token);
  if (!payload || !staffRoles.has(payload.role)) return;

  if (payload.role === 'admin' || payload.role === 'manager') {
    redirect(`/${locale}/admin`);
  }

  redirect(`/${locale}/access-denied`);
}
