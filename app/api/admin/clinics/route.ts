// app/api/admin/clinics/route.ts
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, address, phone, email } = await req.json();

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Créer la clinique
    const newClinic = await prisma.clinic.create({
      data: {
        name,
        address,
        phone,
        email,
        isActive: true
      }
    });

    return NextResponse.json(newClinic);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
    try {
      const { userId } = getAuth(req as any);
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      // Vérifier que l'utilisateur est admin
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        select: { role: true }
      });
  
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
  
      // Récupérer toutes les cliniques
      const clinics = await prisma.clinic.findMany({
        where: { isActive: true }
      });
  
      return NextResponse.json(clinics);
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  }