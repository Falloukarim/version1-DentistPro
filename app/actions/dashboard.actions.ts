'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function getTodaysAppointments() {
    const { userId } = await auth();
    if (!userId) throw new Error("Non autorisé");
  
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { clinic: true }
    });
  
    if (!user) throw new Error("Utilisateur non trouvé");
    // Filtre par clinique si l'utilisateur n'est pas SUPER_ADMIN
    const clinicFilter = user.role !== 'SUPER_ADMIN'? { clinicId: user.clinicId } : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filtre selon le rôle de l'utilisateur
    const roleFilter = user.role === 'DENTIST' 
      ? { dentistId: user.id }
      : user.role === 'ASSISTANT'
      ? { createdById: user.id }
      : {};

    return prisma.appointment.findMany({
      where: {
        ...clinicFilter,
        ...roleFilter,
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: {
        date: 'asc'
      },
      select: {
        id: true,
        patientName: true,
        patientPhone: true,
        date: true,
        reason: true,
        status: true,
        clinic: user.role === 'SUPER_ADMIN'  ? { select: { name: true } } : undefined
      }
    });
}

export async function getLowStockProducts(threshold = 3) {
  const { userId } = await auth();
  if (!userId) throw new Error('Non autorisé');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  });

  if (!user) throw new Error('Utilisateur non trouvé');

  return await prisma.product.findMany({
    where: {
      userId: user.id,
      stock: { lt: threshold }
    },
    select: {
      id: true,
      name: true,
      stock: true
    },
    orderBy: { stock: 'asc' }
  });
}
export async function getUnpaidTreatments() {
    const { userId } = await auth();
    if (!userId) throw new Error("Non autorisé");
  
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { clinic: true }
    });
  
    if (!user) throw new Error("Utilisateur non trouvé");

    // Filtre par clinique si l'utilisateur n'est pas SUPER_ADMIN
    const clinicFilter = user.role !== 'SUPER_ADMIN' ? { clinicId: user.clinicId } : {};

    // Filtre selon le rôle
    const roleFilter = user.role === 'SUPER_ADMIN' 
      ? {}
      : {
          OR: [
            { assistantId: user.id },
            { dentistId: user.id }
          ]
        };

    return prisma.treatment.findMany({
      where: {
        consultation: {
          ...clinicFilter,
          ...roleFilter
        },
        status: { in: ['UNPAID', 'PARTIAL'] }
      },
      include: {
        consultation: {
          select: {
            patientName: true,
            patientPhone: true,
            date: true,
            clinic: user.role === 'SUPER_ADMIN' ? { select: { name: true } } : undefined
          }
        }
      },
      orderBy: {
        consultation: {
          date: 'desc'
        }
      }
    });
}

export async function getDashboardStats() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { clinic: true }
  });

  if (!user) throw new Error("Utilisateur non trouvé");

  try {
    // Exécution en parallèle de toutes les requêtes
    const [
      uniquePatients,
      todaysAppointments,
      totalRevenue,
      unpaidTreatments,
      lowStockProducts // Renommé de allProducts à lowStockProducts pour plus de clarté
    ] = await Promise.all([
      // 1. Patients uniques
      user.role === 'SUPER_ADMIN'
        ? prisma.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(DISTINCT "patientPhone") as count
            FROM "consultations"`
        : prisma.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(DISTINCT "patientPhone") as count
            FROM "consultations"
            WHERE ("assistantId" = ${user.id} OR "dentistId" = ${user.id})
            AND "clinicId" = ${user.clinicId}`,

      // 2. Rendez-vous du jour
      prisma.appointment.count({
        where: {
          ...(user.role !== 'SUPER_ADMIN' && { clinicId: user.clinicId }),
          ...(user.role === 'DENTIST' ? { dentistId: user.id } : 
              user.role === 'ASSISTANT' ? { createdById: user.id } : {}),
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),

      // 3. Revenu total
      user.role === 'SUPER_ADMIN'
        ? prisma.$queryRaw<[{ sum: number }]>`
            SELECT COALESCE(SUM(t."paidAmount"), 0) as sum
            FROM "treatments" t
            JOIN "consultations" c ON t."consultationId" = c.id`
        : prisma.$queryRaw<[{ sum: number }]>`
            SELECT COALESCE(SUM(t."paidAmount"), 0) as sum
            FROM "treatments" t
            JOIN "consultations" c ON t."consultationId" = c.id
            WHERE (c."assistantId" = ${user.id} OR c."dentistId" = ${user.id})
            AND c."clinicId" = ${user.clinicId}`,

      // 4. Traitements non payés
      prisma.treatment.count({
        where: {
          consultation: {
            ...(user.role !== 'SUPER_ADMIN' && { clinicId: user.clinicId }),
            ...(user.role !== 'SUPER_ADMIN' && {
              OR: [
                { assistantId: user.id },
                { dentistId: user.id }
              ]
            })
          },
          status: { in: ['UNPAID', 'PARTIAL'] }
        }
      }),

      // 5. Produits en faible stock
      prisma.product.findMany({
        where: {
          ...(user.role !== 'SUPER_ADMIN' && { clinicId: user.clinicId }),
          stock: { gt: 0 } // Uniquement les produits avec stock > 0
        },
        select: {
          id: true,
          name: true,
          stock: true,
          used: true,
          price: true
        },
        orderBy: { stock: 'asc' }
      })
    ]);

    // Calcul du disponible et filtrage des produits critiques
    const productsWithDisponible = lowStockProducts.map(p => ({
      ...p,
      disponible: p.stock - p.used
    }));

    const criticalProducts = productsWithDisponible.filter(p => p.disponible < 3);

    return {
      uniqueClients: Number(uniquePatients[0]?.count) || 0,
      todaysAppointments,
      totalRevenue: totalRevenue[0]?.sum || 0,
      unpaidTreatments,
      lowStockProducts: criticalProducts,
      lowStockCount: criticalProducts.length,
      lowStockValue: criticalProducts.reduce(
        (sum, product) => sum + (product.price * product.disponible), 0
      ),
      hasLowStockItems: criticalProducts.length > 0
    };
  } catch (error) {
    console.error("Erreur dans getDashboardStats:", error);
    throw error;
  }
}