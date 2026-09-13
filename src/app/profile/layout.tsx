import { UnifiedHeaderWrapper } from '@/components/UnifiedHeaderWrapper';

export const dynamic = 'force-dynamic';

export default function ProfileLayout({
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
