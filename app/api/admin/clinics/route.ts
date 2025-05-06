// app/api/admin/clinics/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true, clinicId: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const clinics = await prisma.clinic.findMany({
      where: user.clinicId ? { id: user.clinicId } : undefined,
      select: {
        id: true,
        name: true,
        address: true
      }
    });

    return NextResponse.json(clinics);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}