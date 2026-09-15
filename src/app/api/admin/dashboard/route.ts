import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';
import { logger } from '@/lib/logger';

const roles = ['guest', 'customer', 'employee', 'kitchen', 'manager', 'admin'] as const;
const statuses = ['active', 'blocked', 'pending'] as const;
const orderStatuses = ['new', 'confirmed', 'cooking', 'ready', 'delivering', 'completed', 'cancelled'] as const;

type Role = (typeof roles)[number];
type Status = (typeof statuses)[number];
type OrderStatus = (typeof orderStatuses)[number];

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) =>
    typeof item === 'bigint' ? item.toString() : item,
  ));
}

async function getActor(userId: string) {
  return prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, tenant_id: true, role: true, email: true },
  });
}

function tenantScope(tenantId: string | null | undefined): { tenant_id?: string } {
  return tenantId ? { tenant_id: tenantId } : {};
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminOrManager(request);
  if (!auth.success || !auth.userId) return auth.error;

  try {
    const actor = await getActor(auth.userId);
    if (!actor) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.trim() || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const userWhere = {
      ...(search ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { first_name: { contains: search, mode: 'insensitive' as const } },
          { last_name: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
      ...(roles.includes(role as Role) ? { role: role as Role } : {}),
      ...(statuses.includes(status as Status) ? { status: status as Status } : {}),
      ...tenantScope(actor.tenant_id),
    };

    const orderWhere = tenantScope(actor.tenant_id);
    const productWhere = { deleted_at: null, ...tenantScope(actor.tenant_id) };
      const [users, usersCount, activeUsersCount, adminCount, ordersCount, revenue, productsCount, activeProductsCount, recentOrders, products, tenant] = await Promise.all([
      prisma.users.findMany({
        where: userWhere,
        select: {
          id: true, email: true, first_name: true, last_name: true, display_name: true,
          role: true, status: true, requires_approval: true, two_fa_enabled: true,
          language: true, last_login_at: true, created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: 100,
      }),
        prisma.users.count({ where: tenantScope(actor.tenant_id) }),
        prisma.users.count({ where: { ...tenantScope(actor.tenant_id), status: 'active' } }),
        prisma.users.count({ where: { ...tenantScope(actor.tenant_id), role: 'admin' } }),
      prisma.orders.count({ where: orderWhere }),
      prisma.orders.aggregate({ where: orderWhere, _sum: { total: true } }),
      prisma.products.count({ where: productWhere }),
      prisma.products.count({ where: { ...productWhere, is_available: true } }),
      prisma.orders.findMany({
        where: orderWhere,
        select: { id: true, order_number: true, customer_name: true, status: true, payment_status: true, total: true, currency: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      prisma.products.findMany({
        where: productWhere,
        select: { id: true, name: true, price: true, currency: true, is_available: true, is_featured: true, sort_order: true, category: { select: { name: true } } },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
        take: 100,
      }),
      actor.tenant_id ? prisma.tenants.findUnique({ where: { id: actor.tenant_id }, select: { id: true, name: true, slug: true, status: true, currency: true, timezone: true, primary_color: true, contact_phone: true, contact_email: true, address_text: true, settings: true } }) : null,
    ]);

    return NextResponse.json(serialize({
      success: true,
      actor: { id: actor.id, email: actor.email, role: actor.role },
      users,
      metrics: { users: usersCount, activeUsers: activeUsersCount, admins: adminCount, orders: ordersCount, revenue: revenue._sum.total || 0, products: productsCount, activeProducts: activeProductsCount },
      recentOrders,
      products,
      tenant,
    }));
  } catch (error) {
    logger.error('Admin dashboard read error', error);
    return NextResponse.json({ error: 'Не удалось загрузить данные админ-панели' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminOrManager(request);
  if (!auth.success || !auth.userId) return auth.error;

  try {
    const actor = await getActor(auth.userId);
    if (!actor) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    const body = await request.json() as {
      resource?: 'user' | 'tenant' | 'order' | 'product';
      id?: string;
      role?: Role;
      status?: Status;
      requiresApproval?: boolean;
      name?: string;
      currency?: string;
      timezone?: string;
      primaryColor?: string | null;
      contactPhone?: string | null;
      contactEmail?: string | null;
      addressText?: string | null;
      siteDescription?: string | null;
      logoUrl?: string | null;
      maintenanceMode?: boolean;
      isAvailable?: boolean;
      price?: string;
      orderStatus?: OrderStatus;
    };

    if (body.resource === 'user') {
      if (!body.id || body.id === actor.id) return NextResponse.json({ error: 'Нельзя изменить текущего администратора' }, { status: 400 });
      if (body.role && !roles.includes(body.role)) return NextResponse.json({ error: 'Недопустимая роль' }, { status: 400 });
      if (body.status && !statuses.includes(body.status)) return NextResponse.json({ error: 'Недопустимый статус' }, { status: 400 });
      if (auth.role !== 'admin' && body.role === 'admin') return NextResponse.json({ error: 'Менеджер не может назначать администратора' }, { status: 403 });

      const target = await prisma.users.findUnique({ where: { id: body.id }, select: { id: true, tenant_id: true, role: true, status: true, requires_approval: true } });
      if (!target || (actor.tenant_id && target.tenant_id !== actor.tenant_id)) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
      if (body.role === 'admin' && auth.role !== 'admin') return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });

      const updated = await prisma.users.update({
        where: { id: body.id },
        data: {
          ...(body.role ? { role: body.role } : {}),
          ...(body.status ? { status: body.status } : {}),
          ...(typeof body.requiresApproval === 'boolean' ? { requires_approval: body.requiresApproval } : {}),
        },
        select: { id: true, email: true, first_name: true, last_name: true, role: true, status: true, requires_approval: true },
      });
      await prisma.activity_logs.create({ data: { tenant_id: target.tenant_id, actor_user_id: actor.id, action: 'admin.user.updated', entity_type: 'users', entity_id: target.id, before_data: target, after_data: updated } });
      return NextResponse.json({ success: true, user: updated });
    }

    if (body.resource === 'tenant') {
      if (!actor.tenant_id) return NextResponse.json({ error: 'У администратора не настроен tenant' }, { status: 400 });
      const currentTenant = await prisma.tenants.findUnique({ where: { id: actor.tenant_id }, select: { settings: true } });
      const currentSettings = currentTenant?.settings && typeof currentTenant.settings === 'object' && !Array.isArray(currentTenant.settings) ? currentTenant.settings as Record<string, unknown> : {};
      const updated = await prisma.tenants.update({
        where: { id: actor.tenant_id },
        data: {
          ...(body.name?.trim() ? { name: body.name.trim() } : {}),
          ...(body.currency?.trim() ? { currency: body.currency.trim().toUpperCase().slice(0, 3) } : {}),
          ...(body.timezone?.trim() ? { timezone: body.timezone.trim() } : {}),
          ...(body.primaryColor !== undefined ? { primary_color: body.primaryColor } : {}),
          ...(body.contactPhone !== undefined ? { contact_phone: body.contactPhone } : {}),
          ...(body.contactEmail !== undefined ? { contact_email: body.contactEmail } : {}),
          ...(body.addressText !== undefined ? { address_text: body.addressText } : {}),
          settings: {
            ...currentSettings,
            ...(body.siteDescription !== undefined ? { siteDescription: body.siteDescription } : {}),
            ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
            ...(typeof body.maintenanceMode === 'boolean' ? { maintenanceMode: body.maintenanceMode } : {}),
          },
        },
        select: { id: true, name: true, slug: true, status: true, currency: true, timezone: true, primary_color: true, contact_phone: true, contact_email: true, address_text: true, settings: true },
      });
      await prisma.activity_logs.create({ data: { tenant_id: actor.tenant_id, actor_user_id: actor.id, action: 'admin.tenant.updated', entity_type: 'tenants', entity_id: actor.tenant_id, after_data: updated } });
      return NextResponse.json({ success: true, tenant: updated });
    }

    if (body.resource === 'order') {
      if (!body.id || !body.orderStatus || !orderStatuses.includes(body.orderStatus)) return NextResponse.json({ error: 'Недопустимый статус заказа' }, { status: 400 });
      const order = await prisma.orders.findUnique({ where: { id: body.id }, select: { id: true, tenant_id: true, status: true } });
      if (!order || (actor.tenant_id && order.tenant_id !== actor.tenant_id)) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
      const updated = await prisma.orders.update({ where: { id: body.id }, data: { status: body.orderStatus, ...(body.orderStatus === 'completed' ? { completed_at: new Date() } : {}), ...(body.orderStatus === 'cancelled' ? { cancelled_at: new Date() } : {}) }, select: { id: true, order_number: true, status: true, payment_status: true, total: true, currency: true, customer_name: true, created_at: true } });
      await prisma.activity_logs.create({ data: { tenant_id: order.tenant_id, actor_user_id: actor.id, action: 'admin.order.updated', entity_type: 'orders', entity_id: order.id, before_data: order, after_data: updated } });
      return NextResponse.json({ success: true, order: updated });
    }

    if (body.resource === 'product') {
      if (!body.id || typeof body.isAvailable !== 'boolean') return NextResponse.json({ error: 'Некорректные данные товара' }, { status: 400 });
      const product = await prisma.products.findUnique({ where: { id: body.id }, select: { id: true, tenant_id: true, is_available: true, price: true } });
      if (!product || (actor.tenant_id && product.tenant_id !== actor.tenant_id)) return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
      const updated = await prisma.products.update({ where: { id: body.id }, data: { is_available: body.isAvailable, ...(body.price && Number.isFinite(Number(body.price)) ? { price: body.price } : {}) }, select: { id: true, name: true, price: true, currency: true, is_available: true, is_featured: true, sort_order: true, category: { select: { name: true } } } });
      await prisma.activity_logs.create({ data: { tenant_id: product.tenant_id, actor_user_id: actor.id, action: 'admin.product.updated', entity_type: 'products', entity_id: product.id, before_data: product, after_data: updated } });
      return NextResponse.json({ success: true, product: updated });
    }

    return NextResponse.json({ error: 'Неизвестный ресурс' }, { status: 400 });
  } catch (error) {
    logger.error('Admin dashboard update error', error);
    return NextResponse.json({ error: 'Не удалось сохранить изменения' }, { status: 500 });
  }
}
