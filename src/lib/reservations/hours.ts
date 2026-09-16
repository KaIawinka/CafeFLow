import { prisma } from '@/lib/prisma';

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')), date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

export async function isWithinBusinessHours(tenantId: string, branchId: string, startAt: Date, endAt: Date, timeZone: string): Promise<boolean> {
  const start = dateParts(startAt, timeZone);
  const end = dateParts(endAt, timeZone);
  if (start.date !== end.date) return false;
  const exception = await prisma.business_hours.findFirst({ where: { tenant_id: tenantId, branch_id: branchId, exception_date: new Date(`${start.date}T00:00:00Z`) }, select: { is_closed: true, open_time: true, close_time: true } });
  const hours = exception || await prisma.business_hours.findFirst({ where: { tenant_id: tenantId, branch_id: branchId, exception_date: null, day_of_week: start.day }, select: { is_closed: true, open_time: true, close_time: true } });
  if (!hours || hours.is_closed || !hours.open_time || !hours.close_time) return false;
  const openMinutes = hours.open_time.getUTCHours() * 60 + hours.open_time.getUTCMinutes();
  const closeMinutes = hours.close_time.getUTCHours() * 60 + hours.close_time.getUTCMinutes();
  return start.minutes >= openMinutes && end.minutes <= closeMinutes;
}