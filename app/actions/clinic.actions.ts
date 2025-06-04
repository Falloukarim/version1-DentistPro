'use server';

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from '@/lib/prisma';
import { syncUserAction } from "./sync-user";
import type { User, Clinic } from "@prisma/client";

// Type pour l'utilisateur avec sa clinique
type UserWithClinic = User & {
  clinic: Clinic | null;
};

// Type pour la condition WHERE des cliniques
type ClinicWhereCondition = {
  id?: string;
  isActive: boolean;
};

// Type pour la condition WHERE des utilisateurs
type UserWhereCondition = {
  clinicId?: string;
};

async function getAuthenticatedUser(): Promise<UserWithClinic> {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorisé");

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Données utilisateur Clerk non disponibles");

  let user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { clinic: true }
  });

  // Si l'utilisateur n'existe pas encore, essayer de le synchroniser
  if (!user) {
    const syncResult = await syncUserAction(userId, clerkUser);
    if (!syncResult.success || !syncResult.user) {
      throw new Error(`Échec de synchronisation: ${syncResult.message}`);
    }
    user = syncResult.user;
  }

  if (!user) throw new Error("Utilisateur non trouvé après synchronisation");
  return user;
}

export async function getClinics() {
  try {
    const user = await getAuthenticatedUser();

    const where: ClinicWhereCondition = user.role === 'SUPER_ADMIN' 
      ? { isActive: true }
      : { 
          id: user.clinicId || undefined,
          isActive: true
        };

    return await prisma.clinic.findMany({
      where,
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
  } catch (error) {
    console.error("Erreur dans getClinics:", error);
    throw new Error("Erreur lors de la récupération des cliniques");
  }
}

export async function getClinicUsers(clinicId?: string) {
  try {
    const user = await getAuthenticatedUser();

    const where: UserWhereCondition = {};

    if (user.role === 'SUPER_ADMIN') {
      if (clinicId) where.clinicId = clinicId;
    } else if (user.clinicId) {
      where.clinicId = user.clinicId;
    }

    return await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        clinicId: true,
        isActive: true
      }
    });
  } catch (error) {
    console.error("Erreur dans getClinicUsers:", error);
    throw new Error("Erreur lors de la récupération des utilisateurs");
  }
}

export async function deleteClinic(clinicId: string) {
  try {
    const user = await getAuthenticatedUser();

    if (user.role !== 'SUPER_ADMIN') {
      throw new Error("Seul un SUPER_ADMIN peut supprimer une clinique");
    }

    return await prisma.clinic.update({
      where: { id: clinicId },
      data: { isActive: false },
      select: { id: true, name: true }
    });
  } catch (error) {
    console.error("Erreur dans deleteClinic:", error);
    throw error;
  }
}

export async function getClinicForUser(clerkUserId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Utilisateur Clerk non authentifié");

    let userWithClinic = await prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        clinic: {
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
        }
      }
    });

    // Synchroniser si l'utilisateur n'existe pas
    if (!userWithClinic) {
      const syncResult = await syncUserAction(clerkUserId, clerkUser);
      if (!syncResult.success || !syncResult.user) {
        throw new Error(`Échec de synchronisation: ${syncResult.message}`);
      }
      userWithClinic = syncResult.user;
    }

    // Retourner la clinique ou une valeur par défaut
    return userWithClinic?.clinic || {
      id: 'default-clinic',
      name: 'Clinique Principale',
      address: '',
      phone: '',
      email: '',
      logoUrl: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      isActive: true
    };
  } catch (error) {
    console.error("Erreur dans getClinicForUser:", error);
    throw new Error("Erreur lors de la récupération de la clinique");
  }
}