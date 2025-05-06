import prisma  from "./prisma";
import { getCurrentUser } from "./auth";

export async function getUserClinic() {
  const user = await getCurrentUser();
  
  if (!user) throw new Error("Utilisateur non authentifié");
  if (!user.clinicId && user.role !== 'SUPER_ADMIN') {
    throw new Error("Aucune clinique assignée");
  }

  return user.clinicId 
    ? await prisma.clinic.findUnique({ where: { id: user.clinicId } })
    : null;
}

export async function verifyClinicAccess(clinicId: string) {
  const user = await getCurrentUser();
  
  if (user?.role === 'SUPER_ADMIN') return true;
  if (user?.clinicId === clinicId) return true;

  throw new Error("Accès à la clinique non autorisé");
}