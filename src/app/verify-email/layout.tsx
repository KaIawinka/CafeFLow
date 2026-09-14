import { ThemeProvider } from '@/components/ThemeProvider';

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
