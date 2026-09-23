import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPublicCafeContext } from '@/lib/public-context';
import { apiPublicMessage } from '@/lib/api-response';

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item));
}

export async function GET(request: NextRequest) {
  try {
    const context = await getPublicCafeContext(request);
    if (!context) return NextResponse.json({ error: apiPublicMessage(request, 'cafeNotConfigured') }, { status: 503 });

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = 10;

    const where = {
      tenant_id: context.tenant.id,
      status: 'published' as const,
      ...(productId ? { product_id: productId } : {}),
    };

    const [reviews, total, stats] = await Promise.all([
      prisma.reviews.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          rating: true,
          text: true,
          admin_reply: true,
          created_at: true,
          user: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.reviews.count({ where }),
      prisma.reviews.groupBy({
        by: ['rating'],
        where,
        _count: { rating: true },
      }),
    ]);

    const ratingStats = {
      average: 0,
      total: total,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    let sum = 0;
    stats.forEach((stat) => {
      ratingStats.distribution[stat.rating as keyof typeof ratingStats.distribution] = stat._count.rating;
      sum += stat.rating * stat._count.rating;
    });
    ratingStats.average = total > 0 ? Number((sum / total).toFixed(1)) : 0;

    return NextResponse.json(serialize({ 
      reviews, 
      stats: ratingStats,
      pagination: { page, pageSize, total } 
    }));
  } catch (error) {
    console.error('Public reviews read error', error);
    return NextResponse.json({ error: apiPublicMessage(request, 'reviewsLoadFailed') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getPublicCafeContext(request);
    if (!context) return NextResponse.json({ error: apiPublicMessage(request, 'cafeNotConfigured') }, { status: 503 });

    const body = await request.json() as { 
      orderId?: string; 
      productId?: string; 
      rating?: number; 
      text?: string;
    };

    const rating = Number(body.rating);
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: apiPublicMessage(request, 'reviewRatingInvalid') }, { status: 400 });
    }

    if (body.text && body.text.length > 1000) {
      return NextResponse.json({ error: apiPublicMessage(request, 'reviewTextTooLong') }, { status: 400 });
    }

    // Проверяем заказ если указан
    let userId: string | null = null;
    if (body.orderId) {
      const order = await prisma.orders.findFirst({
        where: {
          id: body.orderId,
          tenant_id: context.tenant.id,
          status: 'completed',
        },
        select: { user_id: true },
      });

      if (!order) {
        return NextResponse.json({ error: apiPublicMessage(request, 'orderNotFound') }, { status: 404 });
      }

      // Проверяем, не оставлял ли уже отзыв
      const existingReview = await prisma.reviews.findFirst({
        where: {
          tenant_id: context.tenant.id,
          order_id: body.orderId,
        },
      });

      if (existingReview) {
        return NextResponse.json({ error: apiPublicMessage(request, 'reviewAlreadyExists') }, { status: 409 });
      }

      userId = order.user_id;
    }

    // Проверяем продукт если указан
    if (body.productId) {
      const product = await prisma.products.findFirst({
        where: {
          id: body.productId,
          tenant_id: context.tenant.id,
          deleted_at: null,
        },
      });

      if (!product) {
        return NextResponse.json({ error: apiPublicMessage(request, 'productNotFound') }, { status: 404 });
      }
    }

    const review = await prisma.reviews.create({
      data: {
        tenant_id: context.tenant.id,
        user_id: userId,
        order_id: body.orderId || null,
        product_id: body.productId || null,
        rating,
        text: body.text?.trim() || null,
        status: 'pending', // Требует модерации
      },
      select: {
        id: true,
        rating: true,
        text: true,
        status: true,
        created_at: true,
      },
    });

    return NextResponse.json(serialize({ review }), { status: 201 });
  } catch (error) {
    console.error('Public review create error', error);
    return NextResponse.json({ error: apiPublicMessage(request, 'reviewCreateFailed') }, { status: 500 });
  }
}
