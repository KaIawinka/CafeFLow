import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { locales, type Locale } from "../i18n/config";
import { getTranslations } from "../i18n/utils";
import { Header } from "@/components/Header";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  const t = await getTranslations(locale as Locale, "common");

  return {
    title: t.meta.title,
    description: t.meta.description,
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">
        <Header locale={locale as Locale} />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
