'use server';

import { prisma } from "../../lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getTodaysAppointments() {
    const { userId } = await auth();
    if (!userId) throw new Error("Non autorisé");
  
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });
  
    if (!user) throw new Error("Utilisateur non trouvé");
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
  
    return prisma.appointment.findMany({
      where: {
        OR: [
          { dentistId: user.id },
          { createdById: user.id }
        ],
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
        status: true
      }
    });
}
export async function getUnpaidTreatments() {
    const { userId } = await auth();
    if (!userId) throw new Error("Non autorisé");
  
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });
  
    if (!user) throw new Error("Utilisateur non trouvé");
  
    return prisma.treatment.findMany({
      where: {
        consultation: {
          OR: [
            { assistantId: user.id },
            { dentistId: user.id }
          ]
        },
        status: { in: ['UNPAID', 'PARTIAL'] }
      },
      include: {
        consultation: {
          select: {
            patientName: true,
            patientPhone: true,
            date: true
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
    where: { clerkUserId: userId }
  });

  if (!user) throw new Error("Utilisateur non trouvé");

  try {
    // 1. Compter les patients uniques (numéros de téléphone distincts)
    const uniquePatients = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT "patientPhone") as count
      FROM "consultations"
      WHERE "assistantId" = ${user.id} OR "dentistId" = ${user.id}
    `;

    // 2. Rendez-vous du jour
    const todaysAppointments = await prisma.appointment.count({
      where: {
        OR: [
          { dentistId: user.id },
          { createdById: user.id }
        ],
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    });

    // 3. Revenu total (consultations payées + traitements payés)
    const totalRevenue = await prisma.$queryRaw<[{ sum: number }]>`
  SELECT SUM(
    3000 * (SELECT COUNT(*) FROM consultations WHERE "isPaid" = true AND ("assistantId" = ${user.id} OR "dentistId" = ${user.id})) +
    COALESCE((SELECT SUM(t."paidAmount") FROM "treatments" t 
              JOIN consultations c ON t."consultationId" = c.id
              WHERE c."assistantId" = ${user.id} OR c."dentistId" = ${user.id}), 0)
  ) as sum
`;

    // 4. Consultations non payées
    // Dans getDashboardStats(), remplacez la partie unpaidConsultations par :
const unpaidTreatments = await prisma.treatment.count({
    where: {
      consultation: {
        OR: [
          { assistantId: user.id },
          { dentistId: user.id }
        ]
      },
      status: { in: ['UNPAID', 'PARTIAL'] }
    }
  });
  
  return {
    uniqueClients: Number(uniquePatients[0]?.count) || 0,
    todaysAppointments,
    totalRevenue: totalRevenue[0]?.sum || 0,
    unpaidTreatments // Renommez cette variable
  };
  } catch (error) {
    console.error("Erreur dans getDashboardStats:", error);
    return {
      uniqueClients: 0,
      todaysAppointments: 0,
      totalRevenue: 0,
      unpaidConsultations: 0
    };
  }
}