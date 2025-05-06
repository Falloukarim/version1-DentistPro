// app/api/auth/resolve-conflict/route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;

  if (!userId || !email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // 1. Supprimer les utilisateurs en conflit
    await prisma.user.deleteMany({
      where: {
        email,
        NOT: { clerkUserId: userId }
      }
    });

    // 2. Mettre à jour l'utilisateur actuel
    await prisma.user.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        email,
        firstName: clerkUser.firstName || 'Admin',
        lastName: clerkUser.lastName || 'User',
        role: 'SUPER_ADMIN',
        isActive: true
      },
      update: {
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Conflict resolution failed:', error);
    return NextResponse.json(
      { error: 'Resolution failed' },
      { status: 500 }
    );
  }
}