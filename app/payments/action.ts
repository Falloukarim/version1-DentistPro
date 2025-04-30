'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';

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
  if (!userId) throw new Error('Non autorisé');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  });

  if (!user) throw new Error('Utilisateur non trouvé');

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId }
  });

  if (!consultation) throw new Error('Consultation non trouvée');

  // Vérifier que le montant correspond exactement au prix de la consultation
  const consultationPrice = 3000;
  if (amount !== consultationPrice) {
    throw new Error(`Le montant doit être exactement ${consultationPrice} FCFA pour une consultation`);
  }

  // Vérifier que la consultation n'est pas déjà payée
  if (consultation.isPaid) {
    throw new Error('Cette consultation a déjà été payée');
  }

  // Mettre à jour le statut de paiement de la consultation
  await prisma.consultation.update({
    where: { id: consultationId },
    data: { 
      isPaid: true,
      updatedAt: new Date()
    }
  });

  // Créer un enregistrement de paiement
  await prisma.payment.create({
    data: {
      amount,
      paymentMethod: 'CASH',
      paymentDate: new Date(),
      consultationId,
      createdById: user.id
    }
  });

  revalidatePath(`/consultations/${consultationId}`);
  revalidatePath('/payments');
  redirect(`/consultations/${consultationId}`);
}

// Enregistrer un paiement pour un traitement
export async function addTreatmentPayment(treatmentId: string, data: PaymentInput) {
  const { userId } = await auth();
  if (!userId) throw new Error('Non autorisé');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  });

  if (!user) throw new Error('Utilisateur non trouvé');

  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    include: { consultation: true }
  });

  if (!treatment) throw new Error('Traitement non trouvé');

  // Calculer le nouveau montant payé
  const newPaidAmount = treatment.paidAmount + data.amount;
  const remainingAmount = treatment.amount - newPaidAmount;

  if (newPaidAmount > treatment.amount) {
    throw new Error('Le montant payé dépasse le montant dû');
  }

  // Déterminer le nouveau statut
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

  // Créer un enregistrement de paiement
  await prisma.payment.create({
    data: {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentDate: new Date(data.paymentDate),
      reference: data.reference,
      notes: data.notes,
      treatmentId,
      createdById: user.id
    }
  });

  revalidatePath(`/consultations/${treatment.consultation.id}`);
  revalidatePath('/payments');
  redirect(`/consultations/${treatment.consultation.id}`);
}

// Récupérer l'historique des paiements
export async function getPaymentHistory() {
    const { userId } = await auth();
    if (!userId) throw new Error('Non autorisé');
  
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });
  
    if (!user) throw new Error('Utilisateur non trouvé');
  
    try {
      const payments = await prisma.payment.findMany({
        where: { createdById: user.id },
        include: {
          consultation: {
            select: {
              id: true,
              patientName: true,
              patientPhone: true,
              date: true
            }
          },
          treatment: {
            select: {
              id: true,
              type: true,
              amount: true
            }
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { paymentDate: 'desc' }
      });
  
      console.log('Payments found:', payments); // Ajoutez ce log pour le débogage
      return payments;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }