// app/api/auth/verify/route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    console.log('🔍 UserID from Clerk:', userId);

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

    const email = clerkUser.emailAddresses[0]?.emailAddress || 'no-email@example.com';
    console.log('📧 Email detected:', email);

    // Determine role based on email
    const isSuperAdmin = email === 'falliloukarim98@gmail.com' || email.endsWith('focusprojet7@gmail.com');
    const role: Role = isSuperAdmin ? 'SUPER_ADMIN' : 'ASSISTANT';
    console.log('🎭 Role determined:', role);

    // Check for email conflicts
    const conflictingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          clerkUserId: userId
        }
      }
    });

    if (conflictingUser) {
      console.error('⚠️ Conflict: Another user already has this email.');
      return NextResponse.json(
        { error: 'Email conflict', redirectUrl: '/error' },
        { status: 409 }
      );
    }

    // For non-SUPER_ADMIN users, find or create clinic
    let clinicId: string | null = null;
    if (!isSuperAdmin) {
      const existingClinic = await prisma.clinic.findFirst({
        where: { name: "Clinique Principale" },
        select: { id: true }
      });

      clinicId = existingClinic?.id || (
        await prisma.clinic.create({
          data: {
            name: "Clinique Principale",
            address: "Adresse par défaut",
            isActive: true
          },
          select: { id: true }
        })
      ).id;
    }

    // Sync user with proper typing
    const user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        email,
        firstName: clerkUser.firstName || 'Unknown',
        lastName: clerkUser.lastName || 'User',
        isActive: true,
        role,
        ...(!isSuperAdmin && { clinicId }) // Only assign clinicId if not SUPER_ADMIN
      },
      update: {
        email,
        firstName: clerkUser.firstName || 'Unknown',
        lastName: clerkUser.lastName || 'User',
        role // Update role if needed
      },
      include: {  // Changed from select to include to get relations
        clinic: true
      }
    });

    console.log('✅ User synchronized:', {
      id: user.id,
      role: user.role,
      isActive: user.isActive,
      clinicId: user.clinicId
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
      clinicId: user.clinicId  // Using clinicId directly from user
    });

  } catch (error) {
    console.error('🔥 Verification error:', error);
    return NextResponse.json(
      { error: 'Server error', redirectUrl: '/error' },
      { status: 500 }
    );
  }
}