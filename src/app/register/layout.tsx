import { UnifiedHeaderWrapper } from '@/components/UnifiedHeaderWrapper';
import { ThemeProvider } from '@/components/ThemeProvider';

export const dynamic = 'force-dynamic';

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <UnifiedHeaderWrapper />
      {children}
    </ThemeProvider>
  );
}
