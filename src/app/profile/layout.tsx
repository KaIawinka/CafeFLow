import { UserHeaderWrapper } from '@/components/UserHeaderWrapper';

export const dynamic = 'force-dynamic';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UserHeaderWrapper />
      {children}
    </>
  );
}
