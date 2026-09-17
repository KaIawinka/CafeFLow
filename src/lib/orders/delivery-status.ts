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