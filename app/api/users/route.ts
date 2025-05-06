// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const users = await prisma.user.findMany({
      select: {
        clerkUserId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}