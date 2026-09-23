import { LocationsPage } from '@/components/locations/LocationsPage';
import type { Locale } from '@/app/i18n/config';
import { redirectStaffFromCustomerSurface } from '@/lib/auth/customer-surface';

export default async function Locations({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  await redirectStaffFromCustomerSurface(locale);
  return <LocationsPage locale={locale} />;
}
