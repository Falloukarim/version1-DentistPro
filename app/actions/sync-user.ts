"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from '@/lib/prisma'
import { Role } from "@prisma/client";

export async function syncUserAction() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, message: "Utilisateur non authentifié" };

    const clerkUser = await currentUser();
    if (!clerkUser) return { success: false, message: "Utilisateur Clerk introuvable" };

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return { success: false, message: "Email non trouvé" };

    const isSuperAdmin = email === 'falliloukarim98@gmail.com' || email.endsWith('focusprojet7@gmail.com');
    const role: Role = isSuperAdmin ? "SUPER_ADMIN" : "ASSISTANT";

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { clinic: true }
    });

    if (existingUser) {
      return { 
        success: true, 
        message: "Utilisateur déjà synchronisé",
        user: existingUser
      };
    }

    // Cas où l'email existe mais pas le clerkUserId
    const userWithSameEmail = await prisma.user.findUnique({ where: { email } });
    if (userWithSameEmail) {
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { 
          clerkUserId: userId,
          firstName: clerkUser.firstName || userWithSameEmail.firstName,
          lastName: clerkUser.lastName || userWithSameEmail.lastName
        },
      });
      return { 
        success: true, 
        message: "Utilisateur synchronisé via email",
        user: updatedUser
      };
    }

    // Pour les non-SUPER_ADMIN, trouver ou créer une clinique
    let clinicId: string | undefined;
    if (!isSuperAdmin) {
      // Solution 1: Trouver une clinique existante
      const existingClinic = await prisma.clinic.findFirst({ 
        where: { name: "Clinique Principale" },
        select: { id: true }
      });
      
      clinicId = existingClinic?.id || (await prisma.clinic.create({
        data: {
          name: "Clinique Principale",
          address: "Adresse par défaut",
          phone: "",
          isActive: true
        }
      })).id;
    }

    // Création du nouvel utilisateur
    const userData = {
      clerkUserId: userId,
      email,
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      role,
      isActive: true,
      ...(clinicId && { clinicId }) // N'inclut clinicId que si défini
    };

    const newUser = await prisma.user.create({
      data: userData,
      include: { clinic: true }
    });

    return { 
      success: true, 
      message: "Nouvel utilisateur créé",
      user: newUser
    };

  } catch (error) {
    console.error("Erreur de synchronisation:", error);
    return { 
      success: false, 
      message: "Erreur technique lors de la synchronisation"
    };
  }
}