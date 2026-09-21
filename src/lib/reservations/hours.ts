import { prisma } from '@/lib/prisma';
import { getLocalDateTimeParts } from './time';

function dateParts(date: Date, timeZone: string) {
  return getLocalDateTimeParts(date, timeZone);
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