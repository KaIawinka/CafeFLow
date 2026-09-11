import { type Locale } from "../i18n/config";
import { getTranslations } from "../i18n/utils";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemsSection } from "@/components/landing/ProblemsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { TechSection } from "@/components/landing/TechSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

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
      <ProblemsSection t={t} />
      <FeaturesSection t={t} />
      <BenefitsSection t={t} />
      <AudienceSection t={t} />
      <TechSection t={t} />
      <CTASection t={t} />
      <Footer t={t} />
    </div>
  );
}
