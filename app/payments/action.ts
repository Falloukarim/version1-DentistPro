'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma'

// Types
interface PaymentInput {
  amount: number;
  paymentMethod: string;
  paymentDate: Date | string;
  reference?: string;
  notes?: string;
}

// Enregistrer un paiement pour une consultation
export async function addConsultationPayment(consultationId: string, amount: number) {
  const { userId } = await auth();
  
  // Vérification obligatoire
  if (!userId) {
    throw new Error('Non autorisé - Utilisateur non authentifié');
  }
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { clinic: true }
  });

  if (!user) throw new Error('Utilisateur non trouvé');
  if (!user.clinicId && user.role !== 'SUPER_ADMIN') {
    throw new Error('Aucune clinique assignée');
  }

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId }
  });

  if (!consultation) throw new Error('Consultation non trouvée');

  // Vérification du montant
  const consultationPrice = 3000;
  if (amount !== consultationPrice) {
    throw new Error(`Le montant doit être exactement ${consultationPrice} FCFA pour une consultation`);
  }

  if (consultation.isPaid) {
    throw new Error('Cette consultation a déjà été payée');
  }

  await prisma.$transaction(async () => {
    // Mettre à jour la consultation
    await prisma.consultation.update({
      where: { id: consultationId },
      data: { 
        isPaid: true,
        updatedAt: new Date()
      }
    });
  
    // Créer le paiement - Version corrigée
    await prisma.payment.create({
      data: {
        amount,
        paymentMethod: 'CASH',
        paymentDate: new Date(),
        consultation: {
          connect: { id: consultationId }
        },
        createdBy: {
          connect: { id: user.id }
        },
        clinic: {
          connect: { id: user.clinicId! }
        }
      }
    });
  });

  revalidatePath(`/consultations/${consultationId}`);
  revalidatePath('/payments');
  redirect(`/consultations/${consultationId}`);
}
// Enregistrer un paiement pour un traitement
export async function addTreatmentPayment(treatmentId: string, data: PaymentInput) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Non autorisé - Utilisateur non authentifié');
  }
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { clinic: true }
  });

  if (!user) throw new Error('Utilisateur non trouvé');
  if (!user.clinicId && user.role !== 'SUPER_ADMIN') {
    throw new Error('Aucune clinique assignée');
  }

  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    include: { consultation: true }
  });

  if (!treatment) throw new Error('Traitement non trouvé');

  await prisma.$transaction(async () => {
    // Calculer les nouveaux montants
    const newPaidAmount = treatment.paidAmount + data.amount;
    const remainingAmount = treatment.amount - newPaidAmount;

    if (newPaidAmount > treatment.amount) {
      throw new Error('Le montant payé dépasse le montant dû');
    }

    const newStatus = remainingAmount <= 0 ? 'PAID' : 'PARTIAL';

    // Mettre à jour le traitement
    await prisma.treatment.update({
      where: { id: treatmentId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: remainingAmount,
        status: newStatus,
        updatedAt: new Date()
      }
    });

    // Créer le paiement
    await prisma.payment.create({
      data: {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate),
        reference: data.reference,
        notes: data.notes,
        treatment: {
          connect: { id: treatmentId }
        },
        createdBy: {
          connect: { id: user.id }
        },
        clinic: { connect: { id: user.clinicId! } }
      }
    });
  });

  revalidatePath(`/consultations/${treatment.consultation.id}`);
  revalidatePath('/payments');
  redirect(`/consultations/${treatment.consultation.id}`);
}

// Récupérer l'historique des paiements
// Modifiez votre fonction comme suit
export async function getPaymentHistory() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Utilisateur non authentifié');
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { clinic: true }
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  // Construction de la clause where sans types spécifiques
  const baseCondition = user.role === 'SUPER_ADMIN' 
    ? {} 
    : { createdById: user.id };

  const clinicCondition = user.clinicId
    ? {
        OR: [
          { consultation: { clinicId: user.clinicId } },
          { treatment: { consultation: { clinicId: user.clinicId } } }
        ]
      }
    : {};

  const whereClause = user.role === 'SUPER_ADMIN'
    ? {}
    : {
        OR: [
          baseCondition,
          ...(user.clinicId ? [clinicCondition] : [])
        ]
      };

      return await prisma.payment.findMany({
        where: whereClause,
        include: {
          consultation: {
            include: {  // Changé de select à include pour avoir tous les champs
              clinic: true
            }
          },
          treatment: true,
          createdBy: true,
          clinic: true
        },
        orderBy: { paymentDate: 'desc' }
      });
}