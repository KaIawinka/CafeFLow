import { ReviewsPage } from '@/components/reviews/ReviewsPage';
import type { Locale } from '@/app/i18n/config';
import { redirectStaffFromCustomerSurface } from '@/lib/auth/customer-surface';

export default async function Reviews({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  await redirectStaffFromCustomerSurface(locale);
  return <ReviewsPage locale={locale} />;
}
