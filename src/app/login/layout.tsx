import { UnifiedHeaderWrapper } from '@/components/UnifiedHeaderWrapper';

export const dynamic = 'force-dynamic';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UnifiedHeaderWrapper />
      {children}
    </>
  );
}
