import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { verifyCode } from '@/lib/email/verification';
import { apiError, apiMessage, apiUserMessage } from '@/lib/api-response';
import { logger } from '@/lib/logger';

async function deleteAccount(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    const payload = token ? await verifyAccessToken(token) : null;
    if (!payload) return apiError(request, 'unauthorized', 401);

    const body = await request.json() as { code?: string };
    const code = body.code?.trim() || '';
    if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: apiMessage(request, 'invalidCodeFormat') }, { status: 400 });

    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });
    if (!user) return apiError(request, 'userNotFound', 404);

    const hasCreatedBotKeys = await prisma.bot_access_keys.count({ where: { created_by: user.id } }) > 0;
    if (user.role !== 'customer' || hasCreatedBotKeys) return NextResponse.json({ error: apiUserMessage(request, 'accountDeletionStaffDenied') }, { status: 403 });

    const verification = await verifyCode(user.id, code, 'account_deletion');
    if (!verification.success) {
      return NextResponse.json({ error: verification.errorKey ? apiMessage(request, verification.errorKey) : verification.error }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const userOrders = await tx.orders.findMany({ where: { user_id: user.id }, select: { id: true } });
      const orderIds = userOrders.map((order) => order.id);

      await tx.orders.updateMany({
        where: { user_id: user.id },
        data: {
          user_id: null,
          customer_name: '[deleted account]',
          customer_phone: '[deleted]',
          customer_email: null,
          delivery_address: { deleted_account: true },
          comment: null,
          problem: null,
        },
      });
      await tx.carts.deleteMany({ where: { user_id: user.id } });
      await tx.reservations.updateMany({
        where: { user_id: user.id },
        data: {
          user_id: null,
          guest_name: '[deleted account]',
          guest_phone: '[deleted]',
          guest_email: null,
          comment: null,
          cancel_reason: null,
        },
      });
      if (orderIds.length > 0) {
        await tx.order_deliveries.updateMany({ where: { order_id: { in: orderIds } }, data: { address_snapshot: { deleted_account: true } } });
      }
      await tx.order_deliveries.updateMany({ where: { courier_user_id: user.id }, data: { courier_user_id: null } });
      await tx.order_delivery_events.updateMany({ where: { actor_user_id: user.id }, data: { actor_user_id: null } });
      await tx.notifications.deleteMany({ where: { user_id: user.id } });
      await tx.reviews.deleteMany({ where: { user_id: user.id } });
      await tx.files.updateMany({ where: { uploaded_by: user.id }, data: { uploaded_by: null, original_name: null } });
      await tx.activity_logs.updateMany({ where: { actor_user_id: user.id }, data: { actor_user_id: null, before_data: Prisma.JsonNull, after_data: Prisma.JsonNull, ip_address: null, user_agent: null } });
      await tx.ai_requests.deleteMany({ where: { user_id: user.id } });
      await tx.login_attempts.deleteMany({ where: { OR: [{ usersId: user.id }, { email: user.email }] } });
      await tx.access_requests.updateMany({ where: { approved_by: user.id }, data: { approved_by: null } });

      await tx.customer_addresses.deleteMany({ where: { user_id: user.id } });
      await tx.favorites.deleteMany({ where: { user_id: user.id } });
      await tx.loyalty.deleteMany({ where: { user_id: user.id } });
      await tx.bot_key_activations.deleteMany({ where: { user_id: user.id } });
      await tx.branch_memberships.deleteMany({ where: { user_id: user.id } });
      await tx.access_requests.deleteMany({ where: { user_id: user.id } });
      await tx.auth_sessions.deleteMany({ where: { user_id: user.id } });
      await tx.verification_codes.deleteMany({ where: { user_id: user.id } });
      await tx.telegram_link_codes.deleteMany({ where: { user_id: user.id } });
      await tx.user_settings.deleteMany({ where: { user_id: user.id } });
      await tx.users.delete({ where: { id: user.id } });
    });

    const response = NextResponse.json({ success: true, message: apiUserMessage(request, 'accountDeleted') });
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    logger.info('User account deleted', { userId: user.id });
    return response;
  } catch (error) {
    logger.error('Account deletion error', error);
    return apiError(request, 'server', 500);
  }
}

export const DELETE = deleteAccount;