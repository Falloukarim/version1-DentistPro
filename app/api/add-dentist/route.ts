import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { 
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  serverErrorResponse
} from '@/lib/api-helpers';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorizedResponse();

    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (currentUser?.role !== 'SUPER_ADMIN') return forbiddenResponse();

    const body = await req.json();
    console.log('Received data:', body); // Pour le débogage

    // Validation améliorée
    const { firstName, lastName, email, clerkUserId, role } = body;
    
    if (!firstName?.trim()) return badRequestResponse("Le prénom est requis");
    if (!email?.trim()) return badRequestResponse("L'email est requis");
    if (!clerkUserId?.trim()) return badRequestResponse("L'ID Clerk est requis");
    if (!role || !['DENTIST', 'ADMIN'].includes(role)) {
      return badRequestResponse("Rôle invalide");
    }

    // Vérification de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return badRequestResponse("Format d'email invalide");
    }

    // Vérification des doublons
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.trim() },
          { clerkUserId: clerkUserId.trim() }
        ]
      }
    });

    if (existingUser) {
      return badRequestResponse("Un utilisateur avec cet email ou ID Clerk existe déjà");
    }

    // Création de l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        clerkUserId: clerkUserId.trim(),
        firstName: firstName.trim(),
        lastName: lastName?.trim() || "",
        email: email.trim(),
        role,
        isActive: true
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("Error in /api/add-dentist:", error);
    return serverErrorResponse(error);
  }
}