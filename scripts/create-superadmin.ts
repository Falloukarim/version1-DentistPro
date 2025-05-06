#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const EMAIL = 'falliloukarim98@gmail.com';
  const CLERK_ID = 'user_2vuNzffGoHkk0APkXRoWW9IAyg0'; // METTRE LE BON ID CLERK

  // 1. Supprimer l'utilisateur existant s'il y a conflit
  await prisma.user.deleteMany({
    where: {
      email: EMAIL,
      NOT: { clerkUserId: CLERK_ID }
    }
  });

  // 2. Créer/update le SUPER_ADMIN
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      clerkUserId: CLERK_ID,
      role: 'SUPER_ADMIN',
      isActive: true
    },
    create: {
      email: EMAIL,
      firstName: 'Admin',
      lastName: 'System',
      clerkUserId: CLERK_ID,
      role: 'SUPER_ADMIN',
      isActive: true,
      clinic: {
        create: {
          name: 'Clinique Principale',
          address: 'Adresse par défaut'
        }
      }
    }
  });

  console.log('✅ SUPER_ADMIN configuré :', user);
}

main().finally(() => prisma.$disconnect());