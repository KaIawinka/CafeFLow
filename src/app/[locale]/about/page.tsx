import { AboutPage } from '@/components/about/AboutPage';
import type { Locale } from '@/app/i18n/config';
import { redirectStaffFromCustomerSurface } from '@/lib/auth/customer-surface';

export default async function About({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  await redirectStaffFromCustomerSurface(locale);
  return <AboutPage locale={locale} />;
}
