import { UserHeaderWrapper } from '@/components/UserHeaderWrapper';

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
