import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { UnifiedHeader } from './UnifiedHeader';

/**
 * Server Component wrapper for UnifiedHeader
 * Fetches user data server-side and passes to client component
 */
export async function UnifiedHeaderWrapper() {
  let userData = null;
  let siteName = 'CaféFlow';

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
            avatar_file: {
              select: { storage_key: true },
            },
            role: true,
            status: true,
            tenant_id: true,
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
            avatarUrl: user.avatar_file?.storage_key || undefined,
            role: user.role,
            status: user.status,
          };
          if (user.tenant_id) {
            const tenant = await prisma.tenants.findUnique({ where: { id: user.tenant_id }, select: { name: true } });
            siteName = tenant?.name || siteName;
          }
        }
        if (!user) {
          const tenant = await prisma.tenants.findFirst({ orderBy: { created_at: 'asc' }, select: { name: true } });
          siteName = tenant?.name || siteName;
        }
      }
    } else {
      const tenant = await prisma.tenants.findFirst({ orderBy: { created_at: 'asc' }, select: { name: true } });
      siteName = tenant?.name || siteName;
    }
  } catch (error) {
    console.error('Error fetching user for header:', error);
    // Silently fail - user will see login/register buttons
  }

  return <UnifiedHeader user={userData} siteName={siteName} />;
}

// Mark as async Server Component (no 'use client' directive)
UnifiedHeaderWrapper.displayName = 'UnifiedHeaderWrapper';
