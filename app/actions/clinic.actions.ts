'use server';

import { auth } from "@clerk/nextjs/server";
import prisma from '@/lib/prisma';

export async function createClinic(name: string, address?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId as string }, // Conversion explicite en string
    select: { role: true }
  });

  if (user?.role !== 'SUPER_ADMIN') {
    throw new Error("Seul un SUPER_ADMIN peut créer une clinique");
  }

  return prisma.clinic.create({
    data: {
      name,
      address: address ?? undefined, // Convertit null en undefined
      isActive: true
    }
  });
}

export async function getClinics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId as string }, // Conversion explicite
    select: { role: true, clinicId: true }
  });

  if (!user) throw new Error("Utilisateur non trouvé");

  if (user.role === 'SUPER_ADMIN') {
    return prisma.clinic.findMany();
  }

  if (user.clinicId) {
    return prisma.clinic.findMany({
      where: { id: user.clinicId }
    });
  }

  return [];
}

export async function assignUserToClinic(userId: string, clinicId: string) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error("Non autorisé");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: currentUserId as string }, // Conversion explicite
    select: { role: true, clinicId: true }
  });

  if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN')) {
    throw new Error("Autorisation insuffisante");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { clinicId }
  });
}

export async function getClinicUsers(clinicId?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorisé");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: userId as string }, // Conversion explicite
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
      role: true
    }
  });
}
// clinic.actions.ts
export async function deleteClinic(clinicId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId as string },
    select: { role: true }
  });

  if (user?.role !== 'SUPER_ADMIN') {
    throw new Error("Seul un SUPER_ADMIN peut supprimer une clinique");
  }

  return prisma.clinic.delete({
    where: { id: clinicId }
  });
}