import { ContactPage } from '@/components/contact/ContactPage';
import type { Locale } from '@/app/i18n/config';
import { redirectStaffFromCustomerSurface } from '@/lib/auth/customer-surface';

export default async function Contact({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  await redirectStaffFromCustomerSurface(locale);
  return <ContactPage locale={locale} />;
}
