"use server";

import type { Role, User, Clinic } from "@prisma/client";
import prisma from "@/lib/prisma";

interface ClerkUser {
  emailAddresses: { emailAddress: string }[];
  firstName: string | null;
  lastName: string | null;
}

// Type pour l'utilisateur avec sa clinique
type UserWithClinic = User & {
  clinic: Clinic | null;
};

export async function syncUserAction(
  userId: string, 
  clerkUser: ClerkUser | null
): Promise<{
  success: boolean;
  user?: UserWithClinic;
  message: string;
}> {
  try {
    if (!userId || !clerkUser) {
      return { success: false, message: "Utilisateur non authentifié ou Clerk introuvable" };
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) return { success: false, message: "Email non trouvé" };

    const isSuperAdmin = email === 'falliloukarim98@gmail.com';
    const role: Role = isSuperAdmin ? "SUPER_ADMIN" : "ASSISTANT";

    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { clinic: true }
    });

    if (existingUser) {
      return {
        success: true,
        message: "Utilisateur déjà synchronisé",
        user: existingUser as UserWithClinic
      };
    }

    const userWithSameEmail = await prisma.user.findUnique({ 
      where: { email },
      include: { clinic: true }
    });

    if (userWithSameEmail) {
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          clerkUserId: userId,
          firstName: clerkUser.firstName || userWithSameEmail.firstName,
          lastName: clerkUser.lastName || userWithSameEmail.lastName
        },
        include: { clinic: true }
      });
      return {
        success: true,
        message: "Utilisateur synchronisé via email",
        user: updatedUser as UserWithClinic
      };
    }

    // Création de la clinique si nécessaire
    let clinicId: string | null = null;
    if (!isSuperAdmin) {
      const existingClinic = await prisma.clinic.findFirst({ 
        where: { name: "Clinique d'essai" }
      });
      clinicId = existingClinic?.id || (await prisma.clinic.create({
        data: {
          name: "Clinique d'essai",
          address: "Adresse de test ",
          phone: "",
          isActive: true
        }
      })).id;
    }

    const newUser = await prisma.user.create({
      data: {
        clerkUserId: userId,
        email,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        role,
        isActive: true,
        clinicId
      },
      include: { clinic: true }
    });

    return {
      success: true,
      message: "Nouvel utilisateur créé",
      user: newUser as UserWithClinic
    };

  } catch (error) {
    console.error("Erreur syncUser:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Erreur technique lors de la synchronisation" 
    };
  }
}