import { type Locale } from "../i18n/config";
import { getTranslations } from "../i18n/utils";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { PromoCarousel } from "@/components/landing/PromoCarousel";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations(locale, "landing");

  return (
    <div className="flex flex-col">
      <HeroSection t={t} />
      <PromoCarousel locale={locale} />
      <FeaturesSection t={t} locale={locale} />
      <CTASection t={t} locale={locale} />
      <Footer t={t} locale={locale} />
    </div>
  );
}
