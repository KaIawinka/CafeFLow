import { CafeExperience } from '@/components/cafe/CafeExperience';
import type { Locale } from '@/app/i18n/config';

export default async function CartPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <CafeExperience view="cart" locale={locale} />;
}
