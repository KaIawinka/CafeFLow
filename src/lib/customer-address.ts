import { Prisma } from '@prisma/client';

const LIMITS = {
  addressText: 500,
  label: 80,
  entrance: 30,
  floor: 20,
  apartment: 20,
  comment: 500,
} as const;

export type CustomerAddressInput = {
  label?: unknown;
  addressText?: unknown;
  entrance?: unknown;
  floor?: unknown;
  apartment?: unknown;
  comment?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  isDefault?: unknown;
};

export type NormalizedAddress = {
  label: string | null;
  address_text: string;
  entrance: string | null;
  floor: string | null;
  apartment: string | null;
  comment: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  is_default: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, limit: number, required = false): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return required ? undefined : null;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if ((required && !normalized) || normalized.length > limit) return undefined;
  return normalized || null;
}

function coordinate(value: unknown, minimum: number, maximum: number): Prisma.Decimal | null | undefined {
  if (value === undefined || value === null || value === '') return null;
  if ((typeof value !== 'string' && typeof value !== 'number') || !Number.isFinite(Number(value))) return undefined;
  const normalized = Number(value);
  if (normalized < minimum || normalized > maximum) return undefined;
  return new Prisma.Decimal(value);
}

export function parseAddressCreate(body: unknown): NormalizedAddress | null {
  if (!isRecord(body)) return null;
  const addressText = text(body.addressText, LIMITS.addressText, true);
  const label = body.label === undefined ? null : text(body.label, LIMITS.label);
  const entrance = body.entrance === undefined ? null : text(body.entrance, LIMITS.entrance);
  const floor = body.floor === undefined ? null : text(body.floor, LIMITS.floor);
  const apartment = body.apartment === undefined ? null : text(body.apartment, LIMITS.apartment);
  const comment = body.comment === undefined ? null : text(body.comment, LIMITS.comment);
  const latitude = coordinate(body.latitude, -90, 90);
  const longitude = coordinate(body.longitude, -180, 180);
  if (addressText === undefined || addressText === null || label === undefined || entrance === undefined || floor === undefined || apartment === undefined || comment === undefined || latitude === undefined || longitude === undefined) return null;
  if ((latitude === null) !== (longitude === null)) return null;
  if (body.isDefault !== undefined && typeof body.isDefault !== 'boolean') return null;
  return {
    address_text: addressText,
    label: label ?? null,
    entrance: entrance ?? null,
    floor: floor ?? null,
    apartment: apartment ?? null,
    comment: comment ?? null,
    latitude,
    longitude,
    is_default: body.isDefault === true,
  };
}

export function parseAddressUpdate(body: unknown): Partial<NormalizedAddress> | null {
  if (!isRecord(body)) return null;
  const result: Partial<NormalizedAddress> = {};
  const optionalFields = [
    ['label', 'label', LIMITS.label],
    ['entrance', 'entrance', LIMITS.entrance],
    ['floor', 'floor', LIMITS.floor],
    ['apartment', 'apartment', LIMITS.apartment],
    ['comment', 'comment', LIMITS.comment],
  ] as const;
  for (const [inputKey, outputKey, limit] of optionalFields) {
    if (body[inputKey] !== undefined) {
      const value = text(body[inputKey], limit);
      if (value === undefined) return null;
      result[outputKey] = value;
    }
  }
  if (body.addressText !== undefined) {
    const value = text(body.addressText, LIMITS.addressText, true);
    if (value === undefined || value === null) return null;
    result.address_text = value;
  }
  const hasLatitude = body.latitude !== undefined;
  const hasLongitude = body.longitude !== undefined;
  if (hasLatitude || hasLongitude) {
    const latitude = coordinate(body.latitude, -90, 90);
    const longitude = coordinate(body.longitude, -180, 180);
    if (latitude === undefined || longitude === undefined || (latitude === null) !== (longitude === null)) return null;
    result.latitude = latitude;
    result.longitude = longitude;
  }
  if (body.isDefault !== undefined) {
    if (typeof body.isDefault !== 'boolean') return null;
    result.is_default = body.isDefault;
  }
  return Object.keys(result).length ? result : null;
}

export function addressSnapshot(address: {
  id: string;
  label: string | null;
  address_text: string;
  entrance: string | null;
  floor: string | null;
  apartment: string | null;
  comment: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
}) {
  return {
    addressId: address.id,
    label: address.label,
    addressText: address.address_text,
    entrance: address.entrance,
    floor: address.floor,
    apartment: address.apartment,
    comment: address.comment,
    latitude: address.latitude?.toString() ?? null,
    longitude: address.longitude?.toString() ?? null,
  };
}