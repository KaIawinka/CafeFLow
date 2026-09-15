import type { Metadata } from "next";
import { locales, type Locale } from "../i18n/config";
import { getTranslations } from "../i18n/utils";
import { UnifiedHeaderWrapper } from "@/components/UnifiedHeaderWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  const t = await getTranslations(locale as Locale, "common");
  const tenant = await prisma.tenants.findFirst({ orderBy: { created_at: 'asc' }, select: { name: true } });

  return {
    title: tenant?.name || t.meta.title,
    description: t.meta.description,
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <UnifiedHeaderWrapper />
      <main className="flex-1">{children}</main>
    </ThemeProvider>
  );
}
