import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequiredServerSecret } from '@/lib/config';
import { sendEmail } from '@/lib/email/client';

function authorized(request: NextRequest) {
  try { return request.headers.get('authorization') === `Bearer ${getRequiredServerSecret('CRON_SECRET')}`; } catch { return false; }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const queued = await prisma.notifications.findMany({ where: { status: 'queued', attempts: { lt: 5 } }, orderBy: { created_at: 'asc' }, take: 20, select: { id: true, channel: true, subject: true, body: true, attempts: true, user_id: true } });
  let sent = 0;
  let failed = 0;
  for (const notification of queued) {
    const claimed = await prisma.notifications.updateMany({ where: { id: notification.id, status: 'queued', attempts: notification.attempts }, data: { status: 'processing', attempts: { increment: 1 } } });
    if (claimed.count !== 1) continue;
    let delivered = false;
    if (notification.channel === 'in_app') delivered = true;
    if (notification.channel === 'email' && notification.user_id) {
      const user = await prisma.users.findUnique({ where: { id: notification.user_id }, select: { email: true } });
      if (user?.email) delivered = await sendEmail({ to: user.email, subject: notification.subject || 'CaféFlow', text: notification.body, html: `<p>${notification.body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` });
    }
    await prisma.notifications.update({ where: { id: notification.id }, data: { status: delivered ? 'sent' : notification.attempts + 1 >= 5 ? 'failed' : 'queued', sent_at: delivered ? new Date() : null, last_error: delivered ? null : 'Delivery failed' } });
    if (delivered) sent += 1; else failed += 1;
  }
  return NextResponse.json({ success: true, processed: queued.length, sent, failed });
}