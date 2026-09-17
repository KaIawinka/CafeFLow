export const orderStatuses = ['new', 'confirmed', 'cooking', 'ready', 'delivering', 'completed', 'cancelled'] as const;
export type OrderStatus = (typeof orderStatuses)[number];

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['cooking', 'cancelled'],
  cooking: ['ready', 'cancelled'],
  ready: ['delivering', 'completed', 'cancelled'],
  delivering: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to);
}

export function canCustomerCancelOrder(status: OrderStatus): boolean {
  return status === 'new' || status === 'confirmed';
}