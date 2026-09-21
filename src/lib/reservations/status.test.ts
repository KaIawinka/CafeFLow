import { describe, expect, it } from 'vitest';
import { canTransitionReservationStatus } from './status';

describe('reservation status transitions', () => {
  it('allows the operational reservation path', () => {
    expect(canTransitionReservationStatus('pending', 'confirmed')).toBe(true);
    expect(canTransitionReservationStatus('confirmed', 'seated')).toBe(true);
    expect(canTransitionReservationStatus('seated', 'completed')).toBe(true);
  });

  it('allows cancelling or marking an active reservation as no-show', () => {
    expect(canTransitionReservationStatus('pending', 'cancelled')).toBe(true);
    expect(canTransitionReservationStatus('confirmed', 'cancelled')).toBe(true);
    expect(canTransitionReservationStatus('confirmed', 'no_show')).toBe(true);
  });

  it('rejects backward, skipped, repeated and terminal transitions', () => {
    expect(canTransitionReservationStatus('confirmed', 'pending')).toBe(false);
    expect(canTransitionReservationStatus('pending', 'completed')).toBe(false);
    expect(canTransitionReservationStatus('pending', 'pending')).toBe(false);
    expect(canTransitionReservationStatus('completed', 'confirmed')).toBe(false);
    expect(canTransitionReservationStatus('cancelled', 'confirmed')).toBe(false);
  });
});