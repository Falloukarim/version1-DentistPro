import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: params.id },
    include: {
      clinic: true,
      dentist: true,
      payments: true,
    },
  });

  if (!consultation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(consultation);
}
