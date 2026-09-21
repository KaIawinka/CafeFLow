export const reservationStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'] as const;
export type ReservationStatus = (typeof reservationStatuses)[number];

const transitions: Record<ReservationStatus, readonly ReservationStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['seated', 'cancelled', 'no_show'],
  seated: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function canTransitionReservationStatus(from: ReservationStatus, to: ReservationStatus): boolean {
  return transitions[from].includes(to);
}