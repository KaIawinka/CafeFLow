import { describe, expect, it } from 'vitest';
import { canTransitionDeliveryStatus, deliveryRequiresCourier, isDeliveryRetry } from './delivery-status';

describe('delivery state machine', () => {
  it('moves delivery forward through assignment and completion', () => {
    expect(canTransitionDeliveryStatus('pending', 'assigned')).toBe(true);
    expect(canTransitionDeliveryStatus('assigned', 'delivering')).toBe(true);
    expect(canTransitionDeliveryStatus('delivering', 'delivered')).toBe(true);
  });

  it('allows retry only from failed back to assignment', () => {
    expect(isDeliveryRetry('failed', 'assigned')).toBe(true);
    expect(canTransitionDeliveryStatus('failed', 'assigned')).toBe(true);
    expect(isDeliveryRetry('delivering', 'assigned')).toBe(false);
  });

  it('requires a courier after assignment and prevents terminal rollback', () => {
    expect(deliveryRequiresCourier('assigned')).toBe(true);
    expect(deliveryRequiresCourier('pending')).toBe(false);
    expect(canTransitionDeliveryStatus('delivered', 'failed')).toBe(false);
  });
});