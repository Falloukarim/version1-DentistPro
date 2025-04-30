// lib/access-control.ts
import { auth } from '@clerk/nextjs/server';
import { prisma } from './prisma';

/**
 * Valide que l'utilisateur actuel est un admin
 * @throws {Error} Si non autorisé
 */
export async function validateAdmin() {
  const { userId } = await auth();
  
  if (!userId) throw new Error('Authentification requise');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  });

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Accès réservé aux administrateurs');
  }
}

/**
 * Vérifie un rôle spécifique
 */
export async function checkUserRole(requiredRole: 'ADMIN' | 'DENTIST' | 'ASSISTANT') {
  const { userId } = await auth();
  
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId || '' }
  });

  if (!user || user.role !== requiredRole) {
    throw new Error(`Rôle ${requiredRole} requis`);
  }
}