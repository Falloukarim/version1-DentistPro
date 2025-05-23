'use server';

import prisma from '@/lib/prisma'; // Chemin relatif selon votre structureimport { headers } from 'next/headers';

export async function initializeRoles() {
  // 1. Vérification du token
  const authHeader = headers().get('X-Init-Token');
  if (authHeader !== process.env.INIT_SECRET) {
    throw new Error('Unauthorized: Token invalide');
  }

  // 2. Vérifier si l'admin existe déjà
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  if (existingAdmin) {
    throw new Error('Le système a déjà été initialisé');
  }

  // 3. Créer l'admin système
  await prisma.user.create({
    data: {
      clerkUserId: process.env.ADMIN_CLERK_ID!,
      firstName: 'Admin',
      lastName: 'Système',
      email: 'focusprojet',
      role: 'ADMIN',
      isActive: true
    }
  });

  return { success: true };
}