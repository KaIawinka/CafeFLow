import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAccessToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const token = (await cookies()).get('accessToken')?.value;
  const payload = token ? await verifyAccessToken(token) : null;

  if (!payload) redirect(`/${locale}/login`);
  if (payload.role !== 'admin' && payload.role !== 'manager') {
    redirect(`/${locale}/access-denied`);
  }

  return children;
}