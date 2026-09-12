import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { UserHeader } from './UserHeader';

/**
 * Server Component wrapper for UserHeader
 * Fetches user data server-side and passes to client component
 */
export async function UserHeaderWrapper() {
  let userData = null;

  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (token) {
      // Verify token
      const payload = await verifyAccessToken(token);

      if (payload) {
        // Fetch user data
        const user = await prisma.users.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            display_name: true,
            avatar_file_id: true,
            role: true,
            status: true,
          },
        });

        if (user) {
          userData = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name || undefined,
            displayName: user.display_name || undefined,
            avatarFileId: user.avatar_file_id || undefined,
            role: user.role,
            status: user.status,
          };
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user for header:', error);
    // Silently fail - user will see login/register buttons
  }

  return <UserHeader user={userData} />;
}

// Mark as async Server Component (no 'use client' directive)
UserHeaderWrapper.displayName = 'UserHeaderWrapper';
