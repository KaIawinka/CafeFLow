import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPublicCafeContext } from '@/lib/public-context';
import { apiPublicMessage } from '@/lib/api-response';
import { getUserFromSession } from '@/lib/auth/session';

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item));
}

export async function GET(request: NextRequest) {
  try {
    const context = await getPublicCafeContext(request);
    if (!context) return NextResponse.json({ error: apiPublicMessage(request, 'cafeNotConfigured') }, { status: 503 });

    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ favorites: [] });
    }

    const favorites = await prisma.favorites.findMany({
      where: {
        tenant_id: context.tenant.id,
        user_id: user.id,
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        product_id: true,
        created_at: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            currency: true,
            weight: true,
            image_file_ids: true,
            preparation_minutes: true,
            is_available: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(serialize({ favorites }));
  } catch (error) {
    console.error('Public favorites read error', error);
    return NextResponse.json({ error: apiPublicMessage(request, 'favoritesLoadFailed') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getPublicCafeContext(request);
    if (!context) return NextResponse.json({ error: apiPublicMessage(request, 'cafeNotConfigured') }, { status: 503 });

    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: apiPublicMessage(request, 'authRequired') }, { status: 401 });
    }

    const body = await request.json() as { productId?: string };
    if (!body.productId) {
      return NextResponse.json({ error: apiPublicMessage(request, 'productIdRequired') }, { status: 400 });
    }

    // Проверяем существование продукта
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

    // Проверяем, не добавлено ли уже
    const existing = await prisma.favorites.findFirst({
      where: {
        tenant_id: context.tenant.id,
        user_id: user.id,
        product_id: body.productId,
      },
    });

    if (existing) {
      return NextResponse.json({ error: apiPublicMessage(request, 'favoriteAlreadyExists') }, { status: 409 });
    }

    const favorite = await prisma.favorites.create({
      data: {
        tenant_id: context.tenant.id,
        user_id: user.id,
        product_id: body.productId,
      },
      select: {
        id: true,
        product_id: true,
        created_at: true,
      },
    });

    return NextResponse.json(serialize({ favorite }), { status: 201 });
  } catch (error) {
    console.error('Public favorite create error', error);
    return NextResponse.json({ error: apiPublicMessage(request, 'favoriteCreateFailed') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await getPublicCafeContext(request);
    if (!context) return NextResponse.json({ error: apiPublicMessage(request, 'cafeNotConfigured') }, { status: 503 });

    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: apiPublicMessage(request, 'authRequired') }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: apiPublicMessage(request, 'productIdRequired') }, { status: 400 });
    }

    const deleted = await prisma.favorites.deleteMany({
      where: {
        tenant_id: context.tenant.id,
        user_id: user.id,
        product_id: productId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: apiPublicMessage(request, 'favoriteNotFound') }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Public favorite delete error', error);
    return NextResponse.json({ error: apiPublicMessage(request, 'favoriteDeleteFailed') }, { status: 500 });
  }
}
