'use server';

import prisma from '@/lib/prisma';
import { auth } from "@clerk/nextjs/server";
import { Role } from "@prisma/client"; // Importez l'enum Role

export async function updateUserRole(userId: string, role: Role) { // Spécifiez le type Role
  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error("Non autorisé");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: currentUserId },
    select: { role: true }
  });

  if (currentUser?.role !== 'SUPER_ADMIN') {
    throw new Error("Seul un SUPER_ADMIN peut modifier les rôles");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { 
      role: role // Prisma accepte directement la valeur enum
    }
  });
}

export async function getClinicUsers(clinicId?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true, clinicId: true }
  });

  if (!user) throw new Error("Utilisateur non trouvé");

  const filter: { clinicId?: string } = {}; // Typage plus strict
  
  if (user.role === 'SUPER_ADMIN') {
    if (clinicId) {
      filter.clinicId = clinicId;
    }
  } else if (user.role === 'ADMIN') {
    filter.clinicId = user.clinicId ?? undefined; // Gestion du null
  } else {
    return [];
  }

  return prisma.user.findMany({
    where: filter,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true
    }
  });
}