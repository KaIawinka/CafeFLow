import { describe, expect, it } from 'vitest';
import { canTransitionDeliveryStatus } from './delivery-status';

describe('delivery state machine', () => {
  it('moves delivery forward through assignment and completion', () => {
    expect(canTransitionDeliveryStatus('pending', 'assigned')).toBe(true);
    expect(canTransitionDeliveryStatus('assigned', 'delivering')).toBe(true);
    expect(canTransitionDeliveryStatus('delivering', 'delivered')).toBe(true);
  });

  it('allows failed delivery retry from assignment', () => {
    expect(canTransitionDeliveryStatus('failed', 'assigned')).toBe(true);
  });

  it('prevents delivery status rollback and reopening delivered orders', () => {
    expect(canTransitionDeliveryStatus('delivering', 'assigned')).toBe(false);
    expect(canTransitionDeliveryStatus('delivered', 'failed')).toBe(false);
  });
});