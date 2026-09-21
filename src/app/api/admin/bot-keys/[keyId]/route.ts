/**
 * Bot Access Key Management API
 * GET /api/admin/bot-keys/[keyId] - Get specific key details
 * PATCH /api/admin/bot-keys/[keyId] - Update key
 * DELETE /api/admin/bot-keys/[keyId] - Delete key
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { verifyAdminOrManager } from '@/lib/api-middleware';
import { apiAdminMessage, apiError } from '@/lib/api-response';

interface RouteContext {
  params: Promise<{
    keyId: string;
  }>;
}

/**
 * GET - Get specific bot key details
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { keyId } = await context.params;
    const auth = await verifyAdminOrManager(request, 'manage_staff');
    if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || apiError(request, 'unauthorized', 401);

    const key = await prisma.bot_access_keys.findUnique({
      where: { id: keyId, creator: { tenant_id: auth.tenantId } },
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
        { error: apiAdminMessage(request, 'botKeyNotFound') },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      key,
    });

  } catch (error) {
    logger.error('Get bot key error', error);
    
    return apiError(request, 'server', 500);
  }
}

/**
 * PATCH - Update bot key
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { keyId } = await context.params;
    const auth = await verifyAdminOrManager(request, 'manage_staff');
    if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || apiError(request, 'unauthorized', 401);

    const body = await request.json();
    const { description, maxUses, isActive, expiresAt } = body;

    // Check if key exists
    const existingKey = await prisma.bot_access_keys.findUnique({
      where: { id: keyId, creator: { tenant_id: auth.tenantId } },
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: apiAdminMessage(request, 'botKeyNotFound') },
        { status: 404 },
      );
    }

    // Update key
    const updatedKey = await prisma.bot_access_keys.update({
      where: { id: keyId },
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
      keyId,
      updatedBy: auth.userId
    });

    return NextResponse.json({
      success: true,
      key: updatedKey,
    });

  } catch (error) {
    logger.error('Update bot key error', error);
    
    return apiError(request, 'server', 500);
  }
}

/**
 * DELETE - Delete bot key
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { keyId } = await context.params;
    const auth = await verifyAdminOrManager(request, 'manage_staff');
    if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || apiError(request, 'unauthorized', 401);

    // Check if key exists
    const existingKey = await prisma.bot_access_keys.findUnique({
      where: { id: keyId, creator: { tenant_id: auth.tenantId } },
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: apiAdminMessage(request, 'botKeyNotFound') },
        { status: 404 },
      );
    }

    // Delete key (cascade will delete activations)
    await prisma.bot_access_keys.delete({
      where: { id: keyId },
    });

    logger.info('Bot key deleted', { 
      keyId,
      deletedBy: auth.userId
    });

    return NextResponse.json({
      success: true,
      message: apiAdminMessage(request, 'botKeyDeleted'),
    });

  } catch (error) {
    logger.error('Delete bot key error', error);
    
    return apiError(request, 'server', 500);
  }
}
