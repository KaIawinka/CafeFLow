import { Prisma } from '@prisma/client';

export type PromotionType = 'percent' | 'fixed' | 'bonus' | 'free_delivery';

export function calculatePromotionDiscount({
  type,
  value,
  subtotal,
  deliveryFee,
  maxDiscount,
}: {
  type: PromotionType;
  value: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  deliveryFee: Prisma.Decimal;
  maxDiscount: Prisma.Decimal | null;
}) {
  let discount = type === 'percent'
    ? subtotal.mul(value).div(100)
    : type === 'fixed'
      ? value
      : type === 'free_delivery'
        ? deliveryFee
        : new Prisma.Decimal(0);
  if (maxDiscount && discount.gt(maxDiscount)) discount = maxDiscount;
  const maximumDiscount = subtotal.add(deliveryFee);
  if (discount.gt(maximumDiscount)) discount = maximumDiscount;
  return discount;
}