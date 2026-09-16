import { NextRequest, NextResponse } from 'next/server';
import { isIP } from 'node:net';
import { prisma } from '@/lib/prisma';

function clientIp(request: NextRequest): string | null {
  const value = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim() || '';
  return isIP(value) ? value : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string; email?: string; phone?: string; company?: string; message?: string };
    const name = body.name?.trim() || '';
    const email = body.email?.trim().toLowerCase() || '';
    const phone = body.phone?.trim() || null;
    const company = body.company?.trim() || null;
    const message = body.message?.trim() || null;
    if (!name || name.length > 160 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 255 || (phone && phone.length > 40) || (company && company.length > 200) || (message && message.length > 4000)) {
      return NextResponse.json({ error: 'Проверьте данные формы' }, { status: 400 });
    }
    const ipAddress = clientIp(request);
    if (ipAddress) {
      const recent = await prisma.contact_leads.count({ where: { ip_address: ipAddress, created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) } } });
      if (recent >= 3) return NextResponse.json({ error: 'Слишком много заявок. Попробуйте позже.' }, { status: 429 });
    }
    await prisma.contact_leads.create({ data: { name, email, phone, company, message, ip_address: ipAddress } });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Не удалось отправить заявку' }, { status: 500 });
  }
}