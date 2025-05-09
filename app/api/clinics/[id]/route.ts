import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { 
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse
} from '@/lib/api-helpers';

// GET /api/clinics/[id] - Détails d'une clinique
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true, clinicId: true }
    });

    if (!user) return unauthorizedResponse();

    // Vérification des permissions
    if (user.role !== 'SUPER_ADMIN' && user.clinicId !== params.id) {
      return forbiddenResponse();
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        isActive: true
      }
    });

    if (!clinic) return notFoundResponse("Clinique introuvable");

    return NextResponse.json(clinic);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// PATCH /api/clinics/[id] - Mise à jour partielle
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true, clinicId: true }
    });

    if (!user) return unauthorizedResponse();

    // Vérification des permissions
    if (user.role !== 'SUPER_ADMIN' && user.clinicId !== params.id) {
      return forbiddenResponse();
    }

    const body = await req.json();
    
    // Validation minimale
    if (body.name && typeof body.name !== 'string') {
      return badRequestResponse("Nom invalide");
    }

    const updatedClinic = await prisma.clinic.update({
      where: { id: params.id },
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true
      }
    });

    return NextResponse.json(updatedClinic);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// DELETE /api/clinics/[id] - Suppression (désactivation)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') return forbiddenResponse();

    // Désactivation plutôt que suppression
    const clinic = await prisma.clinic.update({
      where: { id: params.id },
      data: { isActive: false },
      select: { id: true, name: true }
    });

    return NextResponse.json({ 
      success: true,
      message: `Clinique ${clinic.name} désactivée`
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}