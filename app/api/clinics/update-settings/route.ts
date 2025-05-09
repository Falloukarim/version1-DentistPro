import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request) {
  const { userId } = getAuth(req as any);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clinicId, primaryColor, secondaryColor } = await req.json();

    // Validation des couleurs (format hexadécimal)
    const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (
      (primaryColor && !colorRegex.test(primaryColor)) ||
      (secondaryColor && !colorRegex.test(secondaryColor))
    ) {
      return NextResponse.json(
        { error: 'Invalid color format' },
        { status: 400 }
      );
    }

    // Vérification des droits
    const clinic = await prisma.clinic.findFirst({
      where: {
        id: clinicId,
        users: {
          some: {
            clerkUserId: userId,
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }
          }
        }
      },
      select: {
        id: true,
        primaryColor: true,
        secondaryColor: true
      }
    });

    if (!clinic) {
      return NextResponse.json(
        { error: 'Clinic not found or unauthorized' },
        { status: 403 }
      );
    }

    // Mise à jour
    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        ...(primaryColor !== undefined && { primaryColor }),
        ...(secondaryColor !== undefined && { secondaryColor })
      },
      select: {
        id: true,
        primaryColor: true,
        secondaryColor: true
      }
    });

    return NextResponse.json(updatedClinic);
  } catch (error) {
    console.error('[CLINIC_SETTINGS_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
