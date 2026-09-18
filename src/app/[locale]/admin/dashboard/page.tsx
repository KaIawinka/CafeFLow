/**
 * Admin Dashboard Page
 * Protected route - requires admin authentication
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import type { Locale } from '@/app/i18n/config';

export default async function AdminDashboard({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  // Check authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    redirect(`/${locale}/login`);
  }

  const payload = await verifyAccessToken(token);

  if (!payload || (payload.role !== 'admin' && payload.role !== 'manager')) {
    redirect(`/${locale}/access-denied`);
  }

  redirect(`/${locale}/admin?tab=dashboard`);
  }
