import { auth } from "@clerk/nextjs/server";
import prisma from "./prisma";
import { redirect } from "next/navigation";
export class AuthService {
  // ✅ Méthode SERVER : Récupère l'utilisateur courant (Clerk + Prisma)
  static async getCurrentUserServer() {
    const { userId } = await auth();
    if (!userId) return null;

    return await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
  }

  // ✅ Méthode CLIENT : Prend un utilisateur Clerk depuis useUser()
  static async getCurrentUserClient(clerkUser: { id: string }) {
    return await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
    });
  }

  // ✅ Obtenir la clinique d’un utilisateur par son ID
  static async getClinicForUser(userId: string) {
    const userWithClinic = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinic: true },
    });

    return userWithClinic?.clinic || null;
  }

  // ✅ Récupérer tous les utilisateurs d’une clinique
  static async getClinicUsers(clinicId: string) {
    return await prisma.user.findMany({
      where: { clinicId },
    });
  }
}

// ✅ Vérifie si l'utilisateur actuel a un rôle autorisé
export async function checkUserRole(allowedRoles: string[]) {
  const { userId } = await auth();
  if (!userId) return redirect('/sign-in');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true },
  });

  if (!user) return redirect('/sign-in');
  if (!allowedRoles.includes(user.role)) {
    return redirect('/unauthorized');
  }

  return true;
}
