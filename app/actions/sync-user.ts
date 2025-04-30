"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../lib/prisma";
import { redirect } from "next/navigation";

export async function syncUserAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, message: "Utilisateur non authentifié" };
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { success: false, message: "Utilisateur Clerk introuvable" };
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return { success: false, message: "Email non trouvé" };
    }

    // Vérifier d'abord si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (existingUser) {
      return { 
        success: true, 
        message: "Utilisateur déjà synchronisé",
        user: existingUser
      };
    }

    // Cas 1: L'email existe mais pas le clerkUserId
    const userWithSameEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (userWithSameEmail) {
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { clerkUserId: userId },
      });
      return { 
        success: true, 
        message: "Utilisateur synchronisé via email",
        user: updatedUser
      };
    }

    // Cas 2: Nouvel utilisateur
    const newUser = await prisma.user.create({
      data: {
        clerkUserId: userId,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        email,
        role: "ASSISTANT", // ou déterminer le rôle autrement
        isActive: true,
        password: "", // ou null si votre schéma le permet
      },
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