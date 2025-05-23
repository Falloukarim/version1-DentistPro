import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "./prisma";
import { offlineDB } from "./offlineDB";


export class AuthService {
  static async getCurrentUser() {
    if (typeof window !== 'undefined') {
      // Client-side: vérifier d'abord le cache offline
      const clerkUser = await clerkClient.users.getUser();
      if (!clerkUser) return null;

      try {
        // Essayer d'abord la base de données en ligne
        const onlineUser = await prisma.user.findUnique({
          where: { clerkUserId: clerkUser.id },
        });

        if (onlineUser) {
          await offlineDB.users.put({
            ...onlineUser,
            syncStatus: 'synced',
            lastSynced: new Date().toISOString(),
          });
          return onlineUser;
        }
      } catch {
        console.log('Online DB unavailable, falling back to offline DB');
      }

      // Fallback vers la base de données hors ligne
      const offlineUser = await offlineDB.users
        .where('clerkUserId')
        .equals(clerkUser.id)
        .first();

      return offlineUser || null;
    } else {
      // Server-side
      const { userId } = await auth();
      if (!userId) return null;

      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
      });

      return user;
    }
  }

  static async getClinicForUser(userId: string) {
    try {
      // Essayer d'abord la base de données en ligne
      const onlineClinic = await prisma.user.findUnique({
        where: { id: userId },
        select: { clinic: true },
      });

      if (onlineClinic?.clinic) {
        await offlineDB.clinics.put({
          ...onlineClinic.clinic,
          syncStatus: 'synced',
          lastSynced: new Date().toISOString(),
        });
        return onlineClinic.clinic;
      }
    } catch (error) {
      console.log('Online DB unavailable, falling back to offline DB');
    }

    // Fallback vers la base de données hors ligne
    const offlineUser = await offlineDB.users.get(userId);
    if (!offlineUser?.clinicId) return null;

    return offlineDB.clinics.get(offlineUser.clinicId);
  }

  static async getClinicUsers(clinicId: string) {
    try {
      // Essayer d'abord la base de données en ligne
      const onlineUsers = await prisma.user.findMany({
        where: { clinicId },
      });

      if (onlineUsers.length > 0) {
        await offlineDB.users.bulkPut(
          onlineUsers.map(user => ({
            ...user,
            syncStatus: 'synced',
            lastSynced: new Date().toISOString(),
          }))
        );
        return onlineUsers;
      }
    } catch (error) {
      console.log('Online DB unavailable, falling back to offline DB');
    }

    // Fallback vers la base de données hors ligne
    return offlineDB.users
      .where('clinicId')
      .equals(clinicId)
      .toArray();
  }
}
// src/lib/auth.ts
// Ajoutez cette fonction à la fin du fichier, avant la dernière accolade fermante

export async function checkUserRole(allowedRoles: string[]) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Non autorisé - Utilisateur non connecté');
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true }
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé dans la base de données');
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Accès refusé - Rôle ${user.role} non autorisé`);
  }

  return true;
}