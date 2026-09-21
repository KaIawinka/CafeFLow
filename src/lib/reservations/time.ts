type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
};

function getZonedDateTimeParts(date: Date, timeZone: string): ZonedDateTimeParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

export function parseLocalDateTime(date: string, time: string, timeZone: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  const localTimestamp = Date.UTC(year, month - 1, day, hour, minute);
  const normalized = new Date(localTimestamp);
  if (
    normalized.getUTCFullYear() !== year
    || normalized.getUTCMonth() !== month - 1
    || normalized.getUTCDate() !== day
    || normalized.getUTCHours() !== hour
    || normalized.getUTCMinutes() !== minute
  ) return null;

  let timestamp = localTimestamp;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getZonedDateTimeParts(new Date(timestamp), timeZone);
    const representedTimestamp = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute);
    timestamp += localTimestamp - representedTimestamp;
  }

  const resolved = getZonedDateTimeParts(new Date(timestamp), timeZone);
  if (
    resolved.year !== year
    || resolved.month !== month
    || resolved.day !== day
    || resolved.hour !== hour
    || resolved.minute !== minute
  ) return null;

  return new Date(timestamp);
}

export function getLocalDateTimeParts(date: Date, timeZone: string) {
  const parts = getZonedDateTimeParts(date, timeZone);
  return {
    day: parts.weekday,
    date: `${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`,
    minutes: parts.hour * 60 + parts.minute,
  };
}