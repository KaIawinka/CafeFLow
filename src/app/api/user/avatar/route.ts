import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import { apiError, apiUserMessage } from '@/lib/api-response';

export const runtime = 'nodejs';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    const payload = token ? await verifyAccessToken(token) : null;

    if (!payload) {
      return apiError(request, 'unauthorized', 401);
    }

    const formData = await request.formData();
    const file = formData.get('avatar');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: apiUserMessage(request, 'avatarFileRequired') }, { status: 400 });
    }

    const extension = ALLOWED_TYPES.get(file.type);
    if (!extension) {
      return NextResponse.json({ error: apiUserMessage(request, 'avatarType') }, { status: 415 });
    }

    if (file.size === 0 || file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json({ error: apiUserMessage(request, 'avatarSize') }, { status: 413 });
    }

    const fileName = `${randomUUID()}.${extension}`;
    const relativePath = `/uploads/avatars/${fileName}`;
    const uploadDirectory = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    const absolutePath = path.join(uploadDirectory, fileName);

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

    const currentUser = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: { avatar_file_id: true },
    });

    const uploadedFile = await prisma.files.create({
      data: {
        storage_key: relativePath,
        original_name: file.name.slice(0, 255),
        mime_type: file.type,
        size_bytes: BigInt(file.size),
        purpose: 'avatar',
        uploaded_by: payload.userId,
      },
      select: { id: true, storage_key: true },
    });

    await prisma.users.update({
      where: { id: payload.userId },
      data: { avatar_file_id: uploadedFile.id },
    });

    if (currentUser?.avatar_file_id) {
      const previousFile = await prisma.files.findUnique({
        where: { id: currentUser.avatar_file_id },
        select: { storage_key: true },
      });

      await prisma.files.delete({ where: { id: currentUser.avatar_file_id } }).catch(() => undefined);
      if (previousFile?.storage_key?.startsWith('/uploads/avatars/')) {
        await unlink(path.join(process.cwd(), 'public', previousFile.storage_key.slice(1))).catch(() => undefined);
      }
    }

    return NextResponse.json({
      success: true,
      avatarUrl: uploadedFile.storage_key,
    });
  } catch (error) {
    logger.error('Avatar upload error', error);
    return NextResponse.json({ error: apiUserMessage(request, 'avatarUploadFailed') }, { status: 500 });
  }
}
