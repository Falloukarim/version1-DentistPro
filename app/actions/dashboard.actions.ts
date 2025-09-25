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
    
    // Correction: Gestion du clinicId null
    const clinicFilter = user.role !== 'SUPER_ADMIN' && user.clinicId 
      ? { clinicId: user.clinicId } 
      : {};

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
        clinic: user.role === 'SUPER_ADMIN' ? { select: { name: true } } : undefined
      }
    });
}

export async function getLowStockProducts(threshold = 3) {
  const { userId } = await auth();
  if (!userId) throw new Error('Non autorisé');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { clinic: true }
  });

  if (!user) throw new Error('Utilisateur non trouvé');

  const clinicFilter =
    user.role !== 'SUPER_ADMIN' && user.clinicId
      ? { clinicId: user.clinicId }
      : {};

  return await prisma.product.findMany({
    where: {
      ...clinicFilter,
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
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error('User not authenticated');
      return [];
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { clinic: true }
    });

    if (!user) {
      console.error('User not found in database');
      return [];
    }

    // Construction du filtre pour la consultation
    const consultationFilter: any = {
      // Filtre par clinique si l'utilisateur n'est pas SUPER_ADMIN
      ...(user.role !== 'SUPER_ADMIN' && user.clinicId ? { clinicId: user.clinicId } : {}),
    };

    // Filtre selon le rôle - CORRECTION IMPORTANTE
    if (user.role !== 'SUPER_ADMIN') {
      consultationFilter.OR = [
        { assistantId: user.id },
        { dentistId: user.id }
      ];
    }

    console.log('Consultation filter:', JSON.stringify(consultationFilter, null, 2));

    const treatments = await prisma.treatment.findMany({
      where: {
        consultation: consultationFilter,
        status: { in: ['UNPAID', 'PARTIAL'] }
      },
      include: {
        consultation: {
          select: {
            patientName: true,
            patientPhone: true,
            date: true,
            // Inclure la clinique seulement pour SUPER_ADMIN
            ...(user.role === 'SUPER_ADMIN' ? {
              clinic: {
                select: {
                  name: true
                }
              }
            } : {})
          }
        }
      },
      orderBy: {
        consultation: {
          date: 'desc'
        }
      }
    });

    console.log(`Found ${treatments.length} unpaid treatments`);
    return treatments;
  } catch (error) {
    console.error('Error in getUnpaidTreatments:', error);
    return [];
  }
}

interface DashboardStats {
  uniqueClients: number;
  todaysAppointments: number;
  totalRevenue: number;
  todaysRevenue: number; 
  unpaidTreatments: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
    used: number;
    price: number;
    disponible: number;
  }>;
  lowStockCount: number;
  lowStockValue: number;
  hasLowStockItems: boolean;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { clinic: true }
  });

  if (!user) throw new Error("Utilisateur non trouvé");

  try {
    // Date du jour (début et fin)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Exécution en parallèle de toutes les requêtes
    const [
      uniquePatients,
      todaysAppointments,
      totalRevenue,
      unpaidTreatments,
      lowStockProducts,
      todaysPayments
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
          ...(user.role !== 'SUPER_ADMIN' && user.clinicId && { clinicId: user.clinicId }),
          ...(user.role === 'DENTIST' ? { dentistId: user.id } : 
              user.role === 'ASSISTANT' ? { createdById: user.id } : {}),
          date: {
            gte: startOfDay,
            lte: endOfDay
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
            ...(user.role !== 'SUPER_ADMIN' && user.clinicId && { clinicId: user.clinicId }),
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
          ...(user.role !== 'SUPER_ADMIN' && user.clinicId && { clinicId: user.clinicId }),
          stock: { gt: 0 }
        },
        select: {
          id: true,
          name: true,
          stock: true,
          used: true,
          price: true
        },
        orderBy: { stock: 'asc' }
      }),

      // 6. Paiements du jour
      prisma.payment.aggregate({
        where: {
          ...(user.role !== 'SUPER_ADMIN' && user.clinicId && { clinicId: user.clinicId }),
          paymentDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        _sum: {
          amount: true
        }
      })
    ]);

    // Typage explicite pour les produits
    const productsWithDisponible = lowStockProducts.map((p: { id: string; name: string; stock: number; used: number; price: number }) => ({
      ...p,
      disponible: p.stock - p.used
    }));

    const criticalProducts = productsWithDisponible.filter((p: { disponible: number; }) => p.disponible < 3);

    return {
      uniqueClients: Number(uniquePatients[0]?.count) || 0,
      todaysAppointments,
      totalRevenue: totalRevenue[0]?.sum || 0,
      todaysRevenue: todaysPayments._sum?.amount || 0, // Nouvelle statistique
      unpaidTreatments,
      lowStockProducts: criticalProducts,
      lowStockCount: criticalProducts.length,
      lowStockValue: criticalProducts.reduce(
        (sum: number, product: { price: number; disponible: number }) => sum + (product.price * product.disponible), 0
      ),
      hasLowStockItems: criticalProducts.length > 0
    };
  } catch (error) {
    console.error("Erreur dans getDashboardStats:", error);
    throw error;
  }
}