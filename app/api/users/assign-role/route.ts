import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { clerkUserId, role } = await req.json();

    if (!clerkUserId || !role) {
      return NextResponse.json({ error: 'Missing clerkUserId or role' }, { status: 400 });
    }

    // Vérification rôle valide (optionnel selon ton enum Prisma)
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'DENTIST', 'ASSISTANT'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { clerkUserId },
      data: { role },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[ASSIGN_ROLE_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
