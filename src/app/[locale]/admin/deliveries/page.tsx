import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import type { Locale } from '@/app/i18n/config';
import { DeliveryOperations } from '@/components/admin/DeliveryOperations';

export const dynamic = 'force-dynamic';

export default async function DeliveriesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const token = (await cookies()).get('accessToken')?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  if (!payload) redirect(`/${locale}/login`);
  if (payload.role !== 'admin' && payload.role !== 'manager') redirect(`/${locale}/access-denied`);
  return <DeliveryOperations locale={locale} />;
}