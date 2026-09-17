import { describe, expect, it } from 'vitest';
import { addressSnapshot, parseAddressCreate, parseAddressUpdate } from './customer-address';

describe('customer address input', () => {
  it('normalizes a complete delivery address', () => {
    const address = parseAddressCreate({ addressText: '  ул. Токтогула, 1 ', label: 'Дом', latitude: '42.8746', longitude: 74.5698, isDefault: true });
    expect(address).toMatchObject({ address_text: 'ул. Токтогула, 1', label: 'Дом', is_default: true });
    expect(address?.latitude?.toString()).toBe('42.8746');
  });

  it('rejects incomplete or out-of-range coordinates', () => {
    expect(parseAddressCreate({ addressText: 'ул. 1', latitude: 42 })).toBeNull();
    expect(parseAddressCreate({ addressText: 'ул. 1', latitude: 91, longitude: 74 })).toBeNull();
  });

  it('rejects empty updates and preserves a structured snapshot', () => {
    expect(parseAddressUpdate({})).toBeNull();
    const created = parseAddressCreate({ addressText: 'ул. 1', entrance: '2', apartment: '34' });
    expect(created).not.toBeNull();
    expect(addressSnapshot({ id: 'address-1', ...created! })).toMatchObject({ addressId: 'address-1', addressText: 'ул. 1', entrance: '2', apartment: '34' });
  });
});