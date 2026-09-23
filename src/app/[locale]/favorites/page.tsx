import { FavoritesPage } from '@/components/favorites/FavoritesPage';
import type { Locale } from '@/app/i18n/config';
import { redirectStaffFromCustomerSurface } from '@/lib/auth/customer-surface';

export default async function Favorites({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  await redirectStaffFromCustomerSurface(locale);
  return <FavoritesPage locale={locale} />;
}
