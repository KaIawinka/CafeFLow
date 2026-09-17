import { ServerCafeExperience } from '@/components/cafe/ServerCafeExperience';
import type { Locale } from '@/app/i18n/config';
import { redirectStaffFromCustomerSurface } from '@/lib/auth/customer-surface';

export default async function BookingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  await redirectStaffFromCustomerSurface(locale);
  return <ServerCafeExperience view="booking" locale={locale} />;
}
