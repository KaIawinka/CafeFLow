import { describe, expect, it } from 'vitest';
import { canTransitionOrderStatus } from './status';

describe('order status transitions', () => {
  it('allows the operational forward path', () => {
    expect(canTransitionOrderStatus('new', 'confirmed')).toBe(true);
    expect(canTransitionOrderStatus('confirmed', 'cooking')).toBe(true);
    expect(canTransitionOrderStatus('cooking', 'ready')).toBe(true);
    expect(canTransitionOrderStatus('ready', 'delivering')).toBe(true);
    expect(canTransitionOrderStatus('delivering', 'completed')).toBe(true);
  });

  it('allows cancelling an active order', () => {
    expect(canTransitionOrderStatus('new', 'cancelled')).toBe(true);
    expect(canTransitionOrderStatus('cooking', 'cancelled')).toBe(true);
    expect(canTransitionOrderStatus('delivering', 'cancelled')).toBe(true);
  });

  it('rejects backward, skipped, repeated and terminal transitions', () => {
    expect(canTransitionOrderStatus('cooking', 'confirmed')).toBe(false);
    expect(canTransitionOrderStatus('new', 'completed')).toBe(false);
    expect(canTransitionOrderStatus('new', 'new')).toBe(false);
    expect(canTransitionOrderStatus('completed', 'cancelled')).toBe(false);
    expect(canTransitionOrderStatus('cancelled', 'confirmed')).toBe(false);
  });
});