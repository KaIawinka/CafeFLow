import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import type { Locale } from '@/app/i18n/config';
import AdminPanelClient from './AdminPanelClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    redirect(`/${locale}/login`);
  }

  const payload = await verifyAccessToken(token);
  if (!payload || (payload.role !== 'admin' && payload.role !== 'manager')) {
    redirect(`/${locale}/access-denied`);
  }

  return <AdminPanelClient />;
}
