// app/api/clinics/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { 
  unauthorizedResponse,
  forbiddenResponse,
  userNotFoundResponse,
  serverErrorResponse,
  badRequestResponse
} from '@/lib/api-helpers';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true, clinicId: true }
    });

    if (!user) return userNotFoundResponse();

    const clinics = user.role === 'SUPER_ADMIN'
      ? await prisma.clinic.findMany()
      : await prisma.clinic.findMany({ where: { id: user.clinicId } });

    return NextResponse.json(clinics);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorizedResponse();

    // Vérification du rôle SUPER_ADMIN
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') return forbiddenResponse();

    const { name, address } = await req.json();
    
    // Validation des données
    if (!name) return badRequestResponse("Le nom de la clinique est requis");

    const clinic = await prisma.clinic.create({
      data: {
        name,
        address: address || undefined,
        isActive: true
      }
    });

    return NextResponse.json(clinic, { status: 201 });
  } catch (error: any) {
    return serverErrorResponse(error);
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorizedResponse();

    // Vérification du rôle ADMIN ou SUPER_ADMIN
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN')) {
      return forbiddenResponse();
    }

    const { userId: targetUserId, clinicId } = await req.json();
    
    // Validation des données
    if (!targetUserId || !clinicId) {
      return badRequestResponse("userId et clinicId sont requis");
    }

    // Vérification que la clinique existe
    const clinicExists = await prisma.clinic.findUnique({
      where: { id: clinicId }
    });
    if (!clinicExists) return badRequestResponse("Clinique introuvable");

    // Mise à jour de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { clinicId }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return serverErrorResponse(error);
  }
}