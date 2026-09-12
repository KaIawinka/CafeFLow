/**
 * Bot Access Key Management API
 * GET /api/admin/bot-keys/[keyId] - Get specific key details
 * PATCH /api/admin/bot-keys/[keyId] - Update key
 * DELETE /api/admin/bot-keys/[keyId] - Delete key
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: {
    keyId: string;
  };
}

/**
 * GET - Get specific bot key details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      );
    }

    const key = await prisma.bot_access_keys.findUnique({
      where: { id: params.keyId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        activations: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                telegram_username: true,
                role: true,
              },
            },
            telegram_chat_id: true,
            activated_at: true,
          },
          orderBy: {
            activated_at: 'desc',
          },
        },
      },
    });

    if (!key) {
      return NextResponse.json(
        { error: 'Ключ не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      key,
    });

  } catch (error) {
    logger.error('Get bot key error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update bot key
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { description, maxUses, isActive, expiresAt } = body;

    // Check if key exists
    const existingKey = await prisma.bot_access_keys.findUnique({
      where: { id: params.keyId },
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: 'Ключ не найден' },
        { status: 404 }
      );
    }

    // Update key
    const updatedKey = await prisma.bot_access_keys.update({
      where: { id: params.keyId },
      data: {
        ...(description !== undefined && { description }),
        ...(maxUses !== undefined && { max_uses: maxUses }),
        ...(isActive !== undefined && { is_active: isActive }),
        ...(expiresAt !== undefined && { 
          expires_at: expiresAt ? new Date(expiresAt) : null 
        }),
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    logger.info('Bot key updated', { 
      keyId: params.keyId, 
      updatedBy: payload.userId 
    });

    return NextResponse.json({
      success: true,
      key: updatedKey,
    });

  } catch (error) {
    logger.error('Update bot key error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete bot key
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      );
    }

    // Check if key exists
    const existingKey = await prisma.bot_access_keys.findUnique({
      where: { id: params.keyId },
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: 'Ключ не найден' },
        { status: 404 }
      );
    }

    // Delete key (cascade will delete activations)
    await prisma.bot_access_keys.delete({
      where: { id: params.keyId },
    });

    logger.info('Bot key deleted', { 
      keyId: params.keyId, 
      deletedBy: payload.userId 
    });

    return NextResponse.json({
      success: true,
      message: 'Ключ успешно удалён',
    });

  } catch (error) {
    logger.error('Delete bot key error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
