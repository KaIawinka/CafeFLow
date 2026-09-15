import { CafeExperience } from '@/components/cafe/CafeExperience';
import type { Locale } from '@/app/i18n/config';

export default async function BookingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  await params;
  return <CafeExperience view="booking" />;
}
