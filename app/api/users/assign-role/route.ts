// app/api/users/assign-role/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    // Vérifier que l'utilisateur a les droits
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { clerkUserId, role } = await req.json();

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { clerkUserId },
      data: { role }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}