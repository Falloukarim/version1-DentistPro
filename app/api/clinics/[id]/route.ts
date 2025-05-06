import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { 
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse
} from '@/lib/api-helpers';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') return forbiddenResponse();

    await prisma.clinic.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}