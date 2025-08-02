"use server";

import type { Role, User, Clinic } from "@prisma/client";
import prisma from "@/lib/prisma";

interface ClerkUser {
  emailAddresses: { emailAddress: string }[];
  firstName: string | null;
  lastName: string | null;
}

type UserWithClinic = User & {
  clinic: Clinic | null;
};

// ID de la clinique par défaut
const DEFAULT_CLINIC_ID = "6c3bfc1f-ac07-4b9b-8819-9f6c2c2b8eb5";

export async function syncUserAction(
  userId: string, 
  clerkUser: ClerkUser | null
): Promise<{
  success: boolean;
  user?: UserWithClinic;
  message: string;
}> {
  try {
    console.log("SYNC USER ACTION TRIGGERED");

    if (!userId || !clerkUser) {
      return { success: false, message: "Utilisateur non authentifié ou Clerk introuvable" };
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    if (!email) return { success: false, message: "Email non trouvé" };

    const isSuperAdmin = email === "falliloukarim98@gmail.com";
    const role: Role = isSuperAdmin ? "SUPER_ADMIN" : "ASSISTANT";

    // 1. Vérifier si un utilisateur avec ce clerkUserId existe déjà
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

    // 2. Vérifier si un utilisateur avec cet email existe déjà
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
          lastName: clerkUser.lastName || userWithSameEmail.lastName,
          // si pas encore associé à une clinique
          clinicId: userWithSameEmail.clinicId ?? (!isSuperAdmin ? DEFAULT_CLINIC_ID : null)
        },
        include: { clinic: true }
      });

      return {
        success: true,
        message: "Utilisateur existant mis à jour avec Clerk ID",
        user: updatedUser as UserWithClinic
      };
    }

    // 3. Créer un nouvel utilisateur s'il n'existe pas du tout
    const clinicId = isSuperAdmin ? null : DEFAULT_CLINIC_ID;
    console.log("CLINIC ID ASSIGNÉ :", clinicId);

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

    console.log("UTILISATEUR CRÉÉ :", newUser.email, "->", newUser.clinic?.name || "Aucune clinique");

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
