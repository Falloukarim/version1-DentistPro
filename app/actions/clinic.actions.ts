'use server';

import { auth } from "@clerk/nextjs/server";
import prisma from '@/lib/prisma';

export async function createClinic(
  name: string, 
  address?: string,
  phone?: string,
  email?: string,
  logoUrl?: string,
  primaryColor?: string,
  secondaryColor?: string
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true }
  });

  if (user?.role !== 'SUPER_ADMIN') {
    throw new Error("Seul un SUPER_ADMIN peut créer une clinique");
  }

  return prisma.clinic.create({
    data: {
      name,
      address: address ?? undefined,
      phone: phone ?? undefined,
      email: email ?? undefined,
      logoUrl: logoUrl ?? undefined,
      primaryColor: primaryColor ?? undefined,
      secondaryColor: secondaryColor ?? undefined,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      email: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true
    }
  });
}

export async function getClinics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true, clinicId: true }
  });

  if (!user) throw new Error("Utilisateur non trouvé");

  const where = user.role === 'SUPER_ADMIN' 
    ? { isActive: true }
    : { id: user.clinicId, isActive: true };

  return prisma.clinic.findMany({
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
}

export async function assignUserToClinic(userId: string, clinicId: string) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error("Non autorisé");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: currentUserId },
    select: { role: true }
  });

  if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN')) {
    throw new Error("Autorisation insuffisante");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { clinicId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      clinicId: true
    }
  });
}

export async function getClinicUsers(clinicId?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorisé");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true, clinicId: true }
  });

  if (!currentUser) throw new Error("Utilisateur non trouvé");

  const where: { clinicId?: string } = {};
  
  if (currentUser.role === 'SUPER_ADMIN') {
    if (clinicId) where.clinicId = clinicId;
  } else if (currentUser.clinicId) {
    where.clinicId = currentUser.clinicId;
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      clinicId: true
    }
  });
}

export async function deleteClinic(clinicId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true }
  });

  if (user?.role !== 'SUPER_ADMIN') {
    throw new Error("Seul un SUPER_ADMIN peut supprimer une clinique");
  }

  // Désactiver plutôt que supprimer pour conserver l'historique
  return prisma.clinic.update({
    where: { id: clinicId },
    data: { isActive: false },
    select: { id: true, name: true }
  });
}

export async function getClinicForUser(clerkUserId: string) {
  const userWithClinic = await prisma.user.findUnique({
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

  if (!userWithClinic) {
    throw new Error('User not found');
  }

  return userWithClinic.clinic;
}