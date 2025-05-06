import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { 
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse
} from '@/lib/api-helpers';

export async function POST(req: Request) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) return unauthorizedResponse();

    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: currentUserId },
      select: { role: true }
    });

    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN')) {
      return forbiddenResponse();
    }

    const { userId, clinicId } = await req.json();
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { clinicId }
    });

    return NextResponse.json(user);
  } catch (error) {
    return serverErrorResponse(error);
  }
}