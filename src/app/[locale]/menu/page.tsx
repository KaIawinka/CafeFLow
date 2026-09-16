import { ServerCafeExperience } from '@/components/cafe/ServerCafeExperience';
import type { Locale } from '@/app/i18n/config';

export default async function MenuPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <ServerCafeExperience view="menu" locale={locale} />;
}
