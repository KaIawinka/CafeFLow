import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { calculatePromotionDiscount } from './discount';

const decimal = (value: string) => new Prisma.Decimal(value);

describe('promotion discount calculation', () => {
  it('applies free delivery to the delivery fee', () => {
    expect(calculatePromotionDiscount({ type: 'free_delivery', value: decimal('0'), subtotal: decimal('100'), deliveryFee: decimal('25'), maxDiscount: null }).toString()).toBe('25');
  });

  it('uses the same cap for fixed and percentage discounts', () => {
    expect(calculatePromotionDiscount({ type: 'fixed', value: decimal('150'), subtotal: decimal('100'), deliveryFee: decimal('25'), maxDiscount: null }).toString()).toBe('125');
    expect(calculatePromotionDiscount({ type: 'percent', value: decimal('50'), subtotal: decimal('100'), deliveryFee: decimal('25'), maxDiscount: decimal('20') }).toString()).toBe('20');
  });
});