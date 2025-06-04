import prisma from "./prisma";

type User = {
  id: string;
  role: string;
  clinicId?: string | null;
};

/**
 * Récupère la clinique d’un utilisateur (en ligne uniquement)
 */
export async function getUserClinic(user: User) {
  if (!user) throw new Error("Utilisateur requis");
  if (!user.clinicId && user.role !== "SUPER_ADMIN") {
    throw new Error("Aucune clinique assignée à l'utilisateur");
  }

  return user.clinicId
    ? await prisma.clinic.findUnique({
        where: { id: user.clinicId },
      })
    : null; // SUPER_ADMIN sans clinique
}

/**
 * Vérifie si un utilisateur a accès à une clinique donnée (en ligne uniquement)
 */
export async function verifyClinicAccess(user: User, clinicId: string) {
  if (!user) throw new Error("Utilisateur requis");

  if (user.role === "SUPER_ADMIN") return true;
  if (user.clinicId === clinicId) return true;

  throw new Error("Accès refusé à cette clinique");
}

/**
 * Récupère les utilisateurs d’une clinique (en ligne uniquement)
 */
export async function getClinicUsers(clinicId: string) {
  return await prisma.user.findMany({
    where: { clinicId },
  });
}
