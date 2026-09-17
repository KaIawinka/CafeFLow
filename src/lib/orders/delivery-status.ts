export const deliveryStatuses = ['pending', 'assigned', 'delivering', 'delivered', 'failed'] as const;
export type DeliveryStatus = (typeof deliveryStatuses)[number];

const transitions: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  pending: ['assigned', 'failed'],
  assigned: ['delivering', 'failed'],
  delivering: ['delivered', 'failed'],
  delivered: [],
  failed: ['assigned'],
};

export function canTransitionDeliveryStatus(from: DeliveryStatus, to: DeliveryStatus) {
  return from === to || transitions[from].includes(to);
}

export function deliveryRequiresCourier(status: DeliveryStatus) {
  return status === 'assigned' || status === 'delivering' || status === 'delivered';
}

export function isDeliveryRetry(from: DeliveryStatus, to: DeliveryStatus) {
  return from === 'failed' && to === 'assigned';
}