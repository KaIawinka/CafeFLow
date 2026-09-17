/**
 * Bot Access Keys API
 * GET /api/admin/bot-keys - Get all bot access keys
 * POST /api/admin/bot-keys - Create new bot access key
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { verifyAdminOrManager } from '@/lib/api-middleware';

/**
 * Generate a unique bot access key
 */
function generateBotKey(keyType: string): string {
  const prefix = 'CAFEFLOW';
  const typeCode = keyType.toUpperCase().substring(0, 3);
  const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
  
  return `${prefix}-${typeCode}-${randomPart}`;
}

/**
 * GET - Get all bot access keys (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminOrManager(request, 'manage_staff');
    if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    // Get all keys with creator info and activation count
    const keys = await prisma.bot_access_keys.findMany({
      where: { creator: { tenant_id: auth.tenantId } },
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
                telegram_username: true,
              },
            },
            activated_at: true,
          },
          orderBy: {
            activated_at: 'desc',
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      keys,
    });

  } catch (error) {
    logger.error('Get bot keys error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new bot access key (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminOrManager(request, 'manage_staff');
    if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const body = await request.json();
    const { keyType, description, maxUses, expiresInDays } = body;

    // Validation
    const validKeyTypes = ['master', 'manager', 'kitchen', 'staff'];
    
    if (!keyType || !validKeyTypes.includes(keyType)) {
      return NextResponse.json(
        { error: 'Неверный тип ключа. Допустимые: master, manager, kitchen, staff' },
        { status: 400 }
      );
    }

    // Generate unique key
    let key = generateBotKey(keyType);
    
    // Ensure uniqueness
    let attempts = 0;
    while (await prisma.bot_access_keys.findUnique({ where: { key } })) {
      key = generateBotKey(keyType);
      attempts++;
      
      if (attempts > 10) {
        throw new Error('Failed to generate unique key');
      }
    }

    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Create key
    const newKey = await prisma.bot_access_keys.create({
      data: {
        key,
        key_type: keyType,
        description: description || null,
        max_uses: maxUses || null,
        expires_at: expiresAt,
        is_active: true,
        created_by: auth.userId,
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

    logger.info('Bot access key created', { 
      keyId: newKey.id, 
      keyType, 
      createdBy: auth.userId
    });

    return NextResponse.json({
      success: true,
      key: newKey,
    }, { status: 201 });

  } catch (error) {
    logger.error('Create bot key error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
