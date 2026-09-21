import { describe, expect, it } from 'vitest';
import { getLocalDateTimeParts, parseLocalDateTime } from './time';

describe('reservation local date-time conversion', () => {
  it('stores branch-local time as the corresponding UTC instant', () => {
    const date = parseLocalDateTime('2026-09-21', '10:00', 'Asia/Bishkek');

    expect(date?.toISOString()).toBe('2026-09-21T04:00:00.000Z');
    expect(getLocalDateTimeParts(date!, 'Asia/Bishkek')).toEqual({ day: 1, date: '2026-09-21', minutes: 600 });
  });

  it('rejects invalid calendar and daylight-saving times', () => {
    expect(parseLocalDateTime('2026-02-30', '10:00', 'Asia/Bishkek')).toBeNull();
    expect(parseLocalDateTime('2026-03-08', '02:30', 'America/New_York')).toBeNull();
  });
});