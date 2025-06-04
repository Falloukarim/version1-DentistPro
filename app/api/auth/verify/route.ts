import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const { userId } = await auth(); // Ne pas utiliser "await" ici
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', redirectUrl: '/sign-in' },
        { status: 401 }
      );
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Clerk user not found', redirectUrl: '/error' },
        { status: 404 }
      );
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: "Email introuvable", redirectUrl: "/error" },
        { status: 400 }
      );
    }

    const isSuperAdmin =
      email === 'falliloukarim98@gmail.com' ||
      email === 'focusprojet7@gmail.com';
    const role: Role = isSuperAdmin ? 'SUPER_ADMIN' : 'ASSISTANT';

    const conflictingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          clerkUserId: userId,
        },
      },
    });

    if (conflictingUser) {
      return NextResponse.json(
        { error: 'Email conflict', redirectUrl: '/error' },
        { status: 409 }
      );
    }

    let clinicId: string | null = null;
    if (!isSuperAdmin) {
      const existingClinic = await prisma.clinic.findFirst({
        where: { name: 'Clinique Principale' },
        select: { id: true },
      });

      if (existingClinic) {
        clinicId = existingClinic.id;
      } else {
        const newClinic = await prisma.clinic.create({
          data: {
            name: 'Clinique Principale',
            address: 'Adresse par défaut',
            isActive: true,
          },
          select: { id: true },
        });
        clinicId = newClinic.id;
      }
    }

    const user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        email,
        firstName: clerkUser.firstName || 'Unknown',
        lastName: clerkUser.lastName || 'User',
        isActive: true,
        role,
        ...(clinicId && { clinicId }),
      },
      update: {
        email,
        firstName: clerkUser.firstName || 'Unknown',
        lastName: clerkUser.lastName || 'User',
        role,
      },
      include: {
        clinic: true,
      },
    });

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account disabled', redirectUrl: '/unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      status: 'authorized',
      role: user.role,
      clinicId: user.clinicId,
    });
  } catch (error) {
    console.error('🔥 Verification error:', error);
    return NextResponse.json(
      { error: 'Server error', redirectUrl: '/error' },
      { status: 500 }
    );
  }
}
