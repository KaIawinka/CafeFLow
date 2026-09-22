import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';
import { logger } from '@/lib/logger';
import { canTransitionOrderStatus, orderStatuses, type OrderStatus } from '@/lib/orders/status';
import { apiAdminMessage, apiError } from '@/lib/api-response';

const roles = ['guest', 'customer', 'employee', 'kitchen', 'manager', 'admin'] as const;
const statuses = ['active', 'blocked', 'pending'] as const;
const orderStatusLabels: Record<OrderStatus, string> = {
  new: 'принят',
  confirmed: 'подтверждён',
  cooking: 'готовится',
  ready: 'готов',
  delivering: 'передан официанту',
  completed: 'завершён',
  cancelled: 'отменён',
};

type Role = (typeof roles)[number];
type Status = (typeof statuses)[number];

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) =>
    typeof item === 'bigint' ? item.toString() : item,
  ));
}

async function getActor(userId: string) {
  return prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, tenant_id: true, branch_id: true, role: true, email: true },
  });
}

function tenantScope(tenantId: string | null | undefined): { tenant_id?: string } {
  return tenantId ? { tenant_id: tenantId } : {};
}

function dayStart(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

async function getAnalytics(tenantId: string | null, branchIds: string[] | null) {
  if (!tenantId) return null;
  const now = new Date();
  const today = dayStart(now);
  const week = new Date(today);
  week.setDate(week.getDate() - 6);
  const month = new Date(today);
  month.setDate(month.getDate() - 29);
  const scope = { tenant_id: tenantId, ...(branchIds ? { branch_id: { in: branchIds } } : {}) };
  const [orders, items, payments, reservations, tables, users, loyalty, reviews] = await Promise.all([
    prisma.orders.findMany({ where: { ...scope, created_at: { gte: month } }, select: { id: true, total: true, status: true, user_id: true, created_at: true, completed_at: true } }),
    prisma.order_items.findMany({ where: { order: { ...scope, created_at: { gte: month }, status: { not: 'cancelled' } } }, select: { product_name: true, quantity: true, line_total: true, product: { select: { category: { select: { name: true } } } } } }),
    prisma.payments.findMany({ where: { tenant_id: tenantId, created_at: { gte: month }, order: branchIds ? { branch_id: { in: branchIds } } : undefined }, select: { method: true, amount: true, captured_amount: true, refunded_amount: true } }),
    prisma.reservations.findMany({ where: { tenant_id: tenantId, ...(branchIds ? { branch_id: { in: branchIds } } : {}), start_at: { gte: month } }, select: { guests_count: true, status: true, start_at: true, end_at: true, table_ids: true } }),
    prisma.restaurant_tables.count({ where: { tenant_id: tenantId, ...(branchIds ? { branch_id: { in: branchIds } } : {}), status: 'active' } }),
    prisma.users.findMany({ where: { tenant_id: tenantId }, select: { id: true, created_at: true, role: true } }),
    prisma.loyalty.findMany({ where: { tenant_id: tenantId }, select: { operation: true, amount: true } }),
    prisma.reviews.findMany({ where: { tenant_id: tenantId, status: 'published' }, select: { rating: true } }),
  ]);
  const sum = (rows: Array<{ total: unknown }>) => rows.reduce((total, row) => total + Number(row.total || 0), 0);
  const from = (date: Date) => orders.filter((order) => order.created_at >= date);
  const monthOrders = from(month);
  const weekOrders = from(week);
  const todayOrders = from(today);
  const productMap = items.reduce<Record<string, { name: string; quantity: number; revenue: number; category: string }>>((map, item) => {
    const current = map[item.product_name] || { name: item.product_name, quantity: 0, revenue: 0, category: item.product?.category?.name || 'Без категории' };
    current.quantity += item.quantity;
    current.revenue += Number(item.line_total || 0);
    map[item.product_name] = current;
    return map;
  }, {});
  const categoryMap = items.reduce<Record<string, number>>((map, item) => {
    const category = item.product?.category?.name || 'Без категории';
    map[category] = (map[category] || 0) + Number(item.line_total || 0);
    return map;
  }, {});
  const occupied = new Set(reservations.filter((reservation) => ['confirmed', 'seated'].includes(reservation.status)).flatMap((reservation) => Array.isArray(reservation.table_ids) ? reservation.table_ids.filter((id): id is string => typeof id === 'string') : []));
  const serviceTimes = monthOrders.filter((order) => order.completed_at).map((order) => (new Date(order.completed_at!).getTime() - order.created_at.getTime()) / 60000).filter((value) => value >= 0 && value < 240);
  return {
    periods: {
      today: { revenue: sum(todayOrders), orders: todayOrders.length },
      week: { revenue: sum(weekOrders), orders: weekOrders.length },
      month: { revenue: sum(monthOrders), orders: monthOrders.length },
    },
    averageOrderValue: monthOrders.length ? sum(monthOrders) / monthOrders.length : 0,
    guests: reservations.reduce((total, reservation) => total + reservation.guests_count, 0),
    occupancy: tables ? Math.round((occupied.size / tables) * 100) : 0,
    dailyRevenue: Array.from({ length: 7 }, (_, index) => { const date = new Date(today); date.setDate(date.getDate() - (6 - index)); const next = new Date(date); next.setDate(next.getDate() + 1); return { date: date.toISOString().slice(0, 10), revenue: sum(orders.filter((order) => order.created_at >= date && order.created_at < next)) }; }),
    paymentMix: Object.entries(payments.reduce<Record<string, { amount: number; count: number }>>((map, payment) => { const current = map[payment.method] || { amount: 0, count: 0 }; current.amount += Number(payment.captured_amount || payment.amount || 0); current.count += 1; map[payment.method] = current; return map; }, {})).map(([method, value]) => ({ method, ...value })),
    refunds: { amount: payments.reduce((total, payment) => total + Number(payment.refunded_amount || 0), 0), count: payments.filter((payment) => Number(payment.refunded_amount || 0) > 0).length },
    cancelled: monthOrders.filter((order) => order.status === 'cancelled').length,
    foodCost: Math.round(sum(monthOrders) * 0.32),
    topProducts: Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    categorySales: Object.entries(categoryMap).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue),
    outsiders: Object.values(productMap).filter((product) => product.quantity === 1).slice(0, 5),
    trafficHeatmap: reservations.map((reservation) => ({ day: new Date(reservation.start_at).getDay(), hour: new Date(reservation.start_at).getHours(), guests: reservation.guests_count })),
    averageServiceMinutes: serviceTimes.length ? Math.round(serviceTimes.reduce((total, value) => total + value, 0) / serviceTimes.length) : 0,
    averageTableMinutes: reservations.length ? Math.round(reservations.reduce((total, reservation) => total + (new Date(reservation.end_at).getTime() - new Date(reservation.start_at).getTime()) / 60000, 0) / reservations.length) : 0,
    staff: users.filter((user) => ['admin', 'manager', 'kitchen', 'employee'].includes(user.role)).map((user) => ({ id: user.id, role: user.role })),
    customerMix: { newCustomers: users.filter((user) => user.created_at >= month).length, returningCustomers: new Set(monthOrders.map((order) => order.user_id).filter(Boolean)).size },
    loyalty: { issued: loyalty.filter((entry) => entry.operation === 'earn').reduce((total, entry) => total + Number(entry.amount || 0), 0), spent: loyalty.filter((entry) => entry.operation === 'spend').reduce((total, entry) => total + Number(entry.amount || 0), 0), members: loyalty.length },
    reviews: { average: reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0, count: reviews.length },
    roleDistribution: Object.entries(users.reduce<Record<string, number>>((map, user) => { map[user.role] = (map[user.role] || 0) + 1; return map; }, {})).map(([role, count]) => ({ role, count })),
  };
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminOrManager(request, 'view_orders');
  if (!auth.success || !auth.userId) return auth.error || apiError(request, 'unauthorized', 401);

  try {
    const actor = await getActor(auth.userId);
    if (!actor) return apiError(request, 'userNotFound', 404);
    const tenantId = auth.tenantId ?? actor.tenant_id;
    const branchIds = auth.branchIds ?? (actor.branch_id ? [actor.branch_id] : null);

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.trim() || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'newest';
    const online = searchParams.get('online');
    const view = searchParams.get('view');
    const usersPage = Math.max(1, Number(searchParams.get('usersPage') || 1));
    const ordersPage = Math.max(1, Number(searchParams.get('ordersPage') || 1));
    const pageSize = 25;
    const searchCondition = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { first_name: { contains: search, mode: 'insensitive' as const } },
        { last_name: { contains: search, mode: 'insensitive' as const } },
        { display_name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { telegram_username: { contains: search, mode: 'insensitive' as const } },
      ],
    } : null;
    const presenceCondition = online === 'offline'
      ? { OR: [{ last_seen_at: null }, { last_seen_at: { lt: new Date(Date.now() - 5 * 60 * 1000) } }] }
      : online === 'online'
        ? { last_seen_at: { gte: new Date(Date.now() - 5 * 60 * 1000) } }
        : null;
    const userConditions: Prisma.usersWhereInput[] = [];
    if (searchCondition) userConditions.push(searchCondition);
    if (presenceCondition) userConditions.push(presenceCondition);
    const userWhere: Prisma.usersWhereInput = {
      ...(userConditions.length ? { AND: userConditions } : {}),
      ...(roles.includes(role as Role) ? { role: role as Role } : {}),
      ...(statuses.includes(status as Status) ? { status: status as Status } : {}),
      ...tenantScope(tenantId),
    };
    const userOrderBy = sort === 'oldest'
      ? { created_at: 'asc' as const }
      : sort === 'nameAsc'
        ? [{ first_name: 'asc' as const }, { last_name: 'asc' as const }, { id: 'asc' as const }]
        : sort === 'nameDesc'
          ? [{ first_name: 'desc' as const }, { last_name: 'desc' as const }, { id: 'desc' as const }]
          : { created_at: 'desc' as const };

    const orderWhere = { ...tenantScope(tenantId), ...(branchIds ? { branch_id: { in: branchIds } } : {}) };
    const productWhere = { deleted_at: null, ...tenantScope(tenantId) };
      const [users, filteredUsersCount, usersCount, activeUsersCount, adminCount, ordersCount, revenue, productsCount, activeProductsCount, recentOrders, recentOrdersCount, products, tenant, analytics] = await Promise.all([
      prisma.users.findMany({
        where: userWhere,
        select: {
          id: true, email: true, first_name: true, last_name: true, display_name: true,
          phone: true, telegram_username: true,
          role: true, status: true, requires_approval: true, two_fa_enabled: true,
          language: true, last_login_at: true, last_seen_at: true, created_at: true,
        },
        orderBy: userOrderBy,
        skip: (usersPage - 1) * pageSize,
        take: pageSize,
      }),
        prisma.users.count({ where: userWhere }),
        prisma.users.count({ where: tenantScope(tenantId) }),
        prisma.users.count({ where: { ...tenantScope(tenantId), status: 'active' } }),
        prisma.users.count({ where: { ...tenantScope(tenantId), role: 'admin' } }),
      prisma.orders.count({ where: orderWhere }),
      prisma.orders.aggregate({ where: orderWhere, _sum: { total: true } }),
      prisma.products.count({ where: productWhere }),
      prisma.products.count({ where: { ...productWhere, is_available: true } }),
      prisma.orders.findMany({
        where: orderWhere,
        select: { id: true, order_number: true, customer_name: true, status: true, payment_status: true, total: true, currency: true, created_at: true },
        orderBy: { created_at: 'desc' },
        skip: (ordersPage - 1) * pageSize,
        take: pageSize,
      }),
      prisma.orders.count({ where: orderWhere }),
      prisma.products.findMany({
        where: productWhere,
        select: { id: true, name: true, price: true, currency: true, is_available: true, is_featured: true, sort_order: true, category: { select: { name: true } } },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
        take: 100,
      }),
      tenantId ? prisma.tenants.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, status: true, currency: true, timezone: true, primary_color: true, contact_phone: true, contact_email: true, address_text: true, settings: true } }) : null,
      view === 'dashboard' ? getAnalytics(tenantId, branchIds) : null,
    ]);

    return NextResponse.json(serialize({
      success: true,
      actor: { id: actor.id, email: actor.email, role: actor.role },
      users: users.map((user) => ({ ...user, is_online: Boolean(user.last_seen_at && user.last_seen_at.getTime() >= Date.now() - 5 * 60 * 1000) })),
      pagination: { usersPage, ordersPage, pageSize, usersTotal: filteredUsersCount, ordersTotal: recentOrdersCount },
      metrics: { users: usersCount, activeUsers: activeUsersCount, admins: adminCount, orders: ordersCount, revenue: revenue._sum.total || 0, products: productsCount, activeProducts: activeProductsCount },
      recentOrders,
      products,
      tenant,
      analytics,
    }));
  } catch (error) {
    logger.error('Admin dashboard read error', error);
    return NextResponse.json({ error: apiAdminMessage(request, 'dashboardLoadFailed') }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
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
      logoData?: string | null;
      maintenanceMode?: boolean;
      siteOptions?: Record<string, boolean>;
      isAvailable?: boolean;
      price?: string;
      orderStatus?: OrderStatus;
    };
    const auth = await verifyAdminOrManager(request, body.resource === 'user' ? 'manage_staff' : 'manage_orders');
    if (!auth.success || !auth.userId) return auth.error || apiError(request, 'unauthorized', 401);

    const actor = await getActor(auth.userId);
    if (!actor) return NextResponse.json({ error: apiAdminMessage(request, 'userOrBranchNotFound') }, { status: 404 });
    const tenantId = auth.tenantId ?? actor.tenant_id;
    const branchIds = auth.branchIds ?? (actor.branch_id ? [actor.branch_id] : null);
    if (body.resource === 'user') {
      if (!body.id || body.id === actor.id) return NextResponse.json({ error: apiAdminMessage(request, 'currentAdminCannotChange') }, { status: 400 });
      if (body.role && !roles.includes(body.role)) return NextResponse.json({ error: apiAdminMessage(request, 'invalidRole') }, { status: 400 });
      if (body.status && !statuses.includes(body.status)) return NextResponse.json({ error: apiAdminMessage(request, 'invalidUserStatus') }, { status: 400 });
      if (auth.role !== 'admin' && body.role === 'admin') return NextResponse.json({ error: apiAdminMessage(request, 'managerCannotAssignAdmin') }, { status: 403 });

      const target = await prisma.users.findUnique({ where: { id: body.id }, select: { id: true, tenant_id: true, branch_id: true, role: true, status: true, requires_approval: true } });
      if (!target || (tenantId && target.tenant_id !== tenantId) || (branchIds && target.branch_id && !branchIds.includes(target.branch_id))) return apiError(request, 'userNotFound', 404);
      if (body.role === 'admin' && auth.role !== 'admin') return NextResponse.json({ error: apiAdminMessage(request, 'insufficientPermissions') }, { status: 403 });

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
      if (body.logoData && (!body.logoData.startsWith('data:image/') || body.logoData.length > 2_000_000)) {
        return NextResponse.json({ error: apiAdminMessage(request, 'invalidLogo') }, { status: 400 });
      }
      let tenantId = actor.tenant_id;
      if (!tenantId) {
        if (auth.role !== 'admin') return NextResponse.json({ error: apiAdminMessage(request, 'adminSettingsRequired') }, { status: 403 });
        const baseSlug = actor.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cafeflow';
        const slug = `${baseSlug}-${actor.id.slice(0, 8)}`;
        const createdTenant = await prisma.tenants.create({ data: { name: body.name?.trim() || 'CaféFlow', slug, status: 'active', currency: body.currency?.trim().toUpperCase().slice(0, 3) || 'KGS', timezone: body.timezone?.trim() || 'Asia/Bishkek' } });
        await prisma.users.update({ where: { id: actor.id }, data: { tenant_id: createdTenant.id } });
        tenantId = createdTenant.id;
      }
      const currentTenant = await prisma.tenants.findUnique({ where: { id: tenantId }, select: { settings: true } });
      const currentSettings = currentTenant?.settings && typeof currentTenant.settings === 'object' && !Array.isArray(currentTenant.settings) ? currentTenant.settings as Record<string, unknown> : {};
      const updated = await prisma.tenants.update({
        where: { id: tenantId },
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
            ...(body.logoData !== undefined ? { logoData: body.logoData } : {}),
            ...(typeof body.maintenanceMode === 'boolean' ? { maintenanceMode: body.maintenanceMode } : {}),
            ...(body.siteOptions ? { siteOptions: body.siteOptions } : {}),
          },
        },
        select: { id: true, name: true, slug: true, status: true, currency: true, timezone: true, primary_color: true, contact_phone: true, contact_email: true, address_text: true, settings: true },
      });
      await prisma.activity_logs.create({ data: { tenant_id: tenantId, actor_user_id: actor.id, action: 'admin.tenant.updated', entity_type: 'tenants', entity_id: tenantId, after_data: updated } });
      return NextResponse.json({ success: true, tenant: updated });
    }

    if (body.resource === 'order') {
      if (!body.id || !body.orderStatus || !orderStatuses.includes(body.orderStatus)) return NextResponse.json({ error: apiAdminMessage(request, 'invalidOrderStatus') }, { status: 400 });
      const order = await prisma.orders.findUnique({ where: { id: body.id }, select: { id: true, tenant_id: true, branch_id: true, user_id: true, order_number: true, status: true, status_history: true } });
      if (!order || (tenantId && order.tenant_id !== tenantId) || (branchIds && (!order.branch_id || !branchIds.includes(order.branch_id)))) return NextResponse.json({ error: apiAdminMessage(request, 'orderNotFound') }, { status: 404 });
      if (!canTransitionOrderStatus(order.status as OrderStatus, body.orderStatus)) return NextResponse.json({ error: apiAdminMessage(request, 'invalidOrderTransition') }, { status: 409 });
      const history = Array.isArray(order.status_history) ? order.status_history : [];
      const statusHistory = [...history, { from: order.status, to: body.orderStatus, changedAt: new Date().toISOString(), changedBy: actor.id }];
      const staff = await prisma.users.findMany({
        where: { tenant_id: order.tenant_id, ...(order.branch_id ? { branch_id: order.branch_id } : {}), status: 'active', role: { in: ['admin', 'manager', 'kitchen', 'employee'] }, id: { not: actor.id } },
        select: { id: true },
      });
      const statusLabel = orderStatusLabels[body.orderStatus];
      const updated = await prisma.$transaction(async (tx) => {
        const changedOrder = await tx.orders.update({ where: { id: body.id }, data: { status: body.orderStatus, status_history: statusHistory, ...(body.orderStatus === 'completed' ? { completed_at: new Date() } : {}), ...(body.orderStatus === 'cancelled' ? { cancelled_at: new Date() } : {}) }, select: { id: true, order_number: true, status: true, payment_status: true, total: true, currency: true, customer_name: true, created_at: true } });
        const notifications = staff.map((member) => ({ tenant_id: order.tenant_id, user_id: member.id, channel: 'in_app' as const, type: 'order_status' as const, subject: 'Изменение заказа', body: `Заказ ${order.order_number} теперь ${statusLabel}`, status: 'queued' as const, attempts: 0 }));
        if (order.user_id) notifications.push({ tenant_id: order.tenant_id, user_id: order.user_id, channel: 'in_app' as const, type: 'order_status' as const, subject: 'Статус заказа', body: `Ваш заказ ${order.order_number} ${statusLabel}`, status: 'queued' as const, attempts: 0 });
        if (notifications.length) await tx.notifications.createMany({ data: notifications });
        return changedOrder;
      });
      await prisma.activity_logs.create({ data: { tenant_id: order.tenant_id, actor_user_id: actor.id, action: 'admin.order.updated', entity_type: 'orders', entity_id: order.id, before_data: order, after_data: updated } });
      return NextResponse.json({ success: true, order: updated });
    }

    if (body.resource === 'product') {
      if (!body.id || typeof body.isAvailable !== 'boolean') return NextResponse.json({ error: apiAdminMessage(request, 'invalidProductData') }, { status: 400 });
      const product = await prisma.products.findUnique({ where: { id: body.id }, select: { id: true, tenant_id: true, is_available: true, price: true } });
      if (!product || (actor.tenant_id && product.tenant_id !== actor.tenant_id)) return NextResponse.json({ error: apiAdminMessage(request, 'productNotFound') }, { status: 404 });
      const updated = await prisma.products.update({ where: { id: body.id }, data: { is_available: body.isAvailable, ...(body.price && Number.isFinite(Number(body.price)) ? { price: body.price } : {}) }, select: { id: true, name: true, price: true, currency: true, is_available: true, is_featured: true, sort_order: true, category: { select: { name: true } } } });
      await prisma.activity_logs.create({ data: { tenant_id: product.tenant_id, actor_user_id: actor.id, action: 'admin.product.updated', entity_type: 'products', entity_id: product.id, before_data: product, after_data: updated } });
      return NextResponse.json({ success: true, product: updated });
    }

    return NextResponse.json({ error: apiAdminMessage(request, 'unknownResource') }, { status: 400 });
  } catch (error) {
    logger.error('Admin dashboard update error', error);
    return NextResponse.json({ error: apiAdminMessage(request, 'dashboardUpdateFailed') }, { status: 500 });
  }
}
