'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import  Prisma  from '@prisma/client';

// Types
interface Dentist {
    id: string;
    firstName: string;
    lastName: string;
  }
  
  interface TreatmentInput {
    id?: string;
    type: string;
    amount: number;
    paidAmount?: number;
    status?: 'UNPAID' | 'PAID' | 'PARTIAL';
    createdAt?: Date | string;
    consultationId?: string;
  }
  
  interface ConsultationInput {
    id?: string;
    patientName: string;
    patientPhone: string;
    patientAddress?: string | null;
    patientAge?: number | null;
    patientGender?: string | null;
    date: Date | string;
    description?: string | null;
    isPaid: boolean;
    treatments?: TreatmentInput[];
    assistantId: string;
    dentistId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }
  
  export interface Consultation {
    id: string;
    patientName: string;
    patientPhone: string;
    patientAddress?: string | null;
    patientAge?: number | null;
    patientGender?: string | null;
    date: Date;
    description?: string | null;
    isPaid: boolean;
    treatments: Treatment[];
    assistantId: string;
    dentistId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  interface Treatment {
    id: string;
    type: string;
    amount: number;
    paidAmount: number;
    status: 'UNPAID' | 'PAID' | 'PARTIAL';
    createdAt: Date;
    consultationId: string;
  }

export async function getAvailableDentists(): Promise<Dentist[]> {
    try {
      return await prisma.user.findMany({
        where: { role: 'DENTIST' },
        select: { id: true, firstName: true, lastName: true }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des dentistes:', error);
      throw new Error('Impossible de charger la liste des dentistes');
    }
  }
  
  export async function addConsultation(prevState: any, formData: FormData | null) {
    if (!formData) return prevState;
    
    try {
      const { userId } = await auth();
      if (!userId) throw new Error('Non autorisé');
      
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId }
      });
      
      if (!user) throw new Error('Utilisateur non trouvé');
      if (user.role !== 'ASSISTANT') throw new Error('Seuls les assistants peuvent créer des consultations');
  
      // Validation des champs obligatoires
      const dentistId = formData.get('dentistId') as string;
      if (!dentistId) throw new Error('Veuillez sélectionner un dentiste');
  
      const patientName = formData.get('patientName') as string;
      if (!patientName || patientName.trim().length < 2) {
        throw new Error('Le nom du patient doit contenir au moins 2 caractères');
      }
  
      const patientPhone = formData.get('patientPhone') as string;
      const phoneRegex = /^(77|76|70|78|75)[0-9]{7}$/;
      
      if (!phoneRegex.test(patientPhone)) {
        throw new Error('Numéro Sénégalais invalide. Doit commencer par 77, 76, 70, 78 ou 75 et avoir 9 chiffres (ex: 771234567)');
      }
  
      const date = formData.get('date') as string;
      if (!date) throw new Error('Veuillez sélectionner une date');
  
      // Création de la consultation avec paiement automatique
      const result = await prisma.$transaction(async (prisma) => {
        // 1. Créer la consultation
        const consultation = await prisma.consultation.create({
          data: {
            patientName,
            patientPhone,
            patientAddress: formData.get('patientAddress') as string || null,
            patientAge: formData.get('patientAge') ? parseInt(formData.get('patientAge') as string) : null,
            patientGender: formData.get('patientGender') as string || null,
            date: new Date(date),
            description: formData.get('description') as string || null,
            isPaid: true,
            assistant: { connect: { id: user.id } },
            dentist: { connect: { id: dentistId } },
            createdBy: { connect: { id: user.id } }
          }
        });
  
        // 2. Créer le paiement associé
        await prisma.payment.create({
          data: {
            amount: 3000,
            paymentMethod: 'CASH',
            paymentDate: new Date(),
            consultation: { connect: { id: consultation.id } },
            createdBy: { connect: { id: user.id } }
          }
        });
  
        return consultation;
      });
  
      revalidatePath('/consultations');
      return { success: true };
      
    } catch (error) {
      console.error('Erreur lors de la création de la consultation:', error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return { error: 'Une consultation existe déjà avec ces informations' };
        }
        if (error.code === 'P2021') {
          return { error: 'La table des paiements n\'existe pas. Veuillez appliquer les migrations.' };
        }
        if (error.code === 'P2016') {
          return { error: 'Erreur de relation - vérifiez les IDs de connexion' };
        }
      }
      
      return { 
        error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
      };
    }
  }
  
  // Fonction pour obtenir les consultations selon le rôle
  export async function fetchConsultations(): Promise<Consultation[]> {
    const { userId } = await auth();
    if (!userId) throw new Error('Non autorisé');
  
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });
  
    if (!user) throw new Error('Utilisateur non trouvé');
  
    const whereClause = user.role === 'ASSISTANT' 
      ? { assistantId: user.id }
      : user.role === 'DENTIST' 
        ? { dentistId: user.id }
        : {};
  
    const consultations = await prisma.consultation.findMany({
      where: whereClause,
      include: { treatments: true, dentist: true, assistant: true },
      orderBy: { date: 'desc' }
    });
  
    return consultations.map(consultation => ({
      ...consultation,
      treatments: consultation.treatments.map(treatment => ({
        ...treatment,
        status: treatment.status as 'UNPAID' | 'PAID' | 'PARTIAL'
      }))
    }));
  }
  

export async function updateConsultation(id: string, data: Partial<ConsultationInput>) {
  const { userId } = await auth();
  if (!userId) throw new Error('Non autorisé');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  });

  if (!user) throw new Error('Utilisateur non trouvé');

  const updateData: any = {
    ...data,
    updatedAt: new Date()
  };

  if (data.date) {
    updateData.date = new Date(data.date);
  }

  // Gestion des champs nullables
  if (data.patientAddress === null) updateData.patientAddress = null;
  if (data.patientAge === null) updateData.patientAge = null;
  if (data.patientGender === null) updateData.patientGender = null;
  if (data.description === null) updateData.description = null;

  await prisma.consultation.update({
    where: { id, assistantId: user.id },
    data: updateData
  });

  revalidatePath('/consultations');
  redirect(`/consultations/${id}`);
}
export async function getTreatmentById(id: string) {
    return await prisma.treatment.findUnique({
      where: { id }
    });
  }
  
  export async function addPayment(treatmentId: string, amount: number) {
    const treatment = await prisma.treatment.findUnique({
      where: { id: treatmentId }
    });
  
    if (!treatment) throw new Error('Traitement non trouvé');
  
    const newPaidAmount = treatment.paidAmount + amount;
    if (newPaidAmount > treatment.amount) {
        throw new Error('Le montant payé dépasse le montant dû');
      }
    const newRemainingAmount = treatment.amount - newPaidAmount;
    const newStatus = newRemainingAmount <= 0 ? 'PAID' : 'PARTIAL';
  
    await prisma.treatment.update({
      where: { id: treatmentId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        updatedAt: new Date()
      }
    });
  }

  export async function addTreatment(
    consultationId: string,
    data: {
      type: string;
      amount: number;
      paidAmount: number;
      remainingAmount: number;
      status: 'UNPAID' | 'PAID' | 'PARTIAL';
    }
  ) {
    const { userId } = await auth();
    if (!userId) throw new Error('Non autorisé');
  
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });
  
    if (!user) throw new Error('Utilisateur non trouvé');
  
    await prisma.$transaction(async (prisma) => {
      // Créer le traitement
      const treatment = await prisma.treatment.create({
        data: {
          type: data.type,
          amount: data.amount,
          paidAmount: data.paidAmount,
          remainingAmount: data.remainingAmount,
          status: data.status,
          consultation: { connect: { id: consultationId } }
        }
      });
  
      // Si un paiement est fait immédiatement
      if (data.paidAmount > 0) {
        await prisma.payment.create({
          data: {
            amount: data.paidAmount,
            paymentMethod: 'CASH',
            paymentDate: new Date(),
            treatment: { connect: { id: treatment.id } },
            createdBy: { connect: { id: user.id } }
          }
        });
      }
    });
  
    revalidatePath(`/consultations/${consultationId}`);
    redirect(`/consultations/${consultationId}`);
  }
export async function getConsultationNotes(consultationId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Utilisateur non authentifié');
  
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });
  
    if (!user) throw new Error('Utilisateur non trouvé');
  
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      select: {
        dentistNote: true,
        assistantNote: true,
        dentist: { select: { firstName: true, lastName: true } },
        assistant: { select: { firstName: true, lastName: true } }
      }
    });
  
    if (!consultation) throw new Error('Consultation non trouvée');
  
    return {
      dentistNote: user.role === 'DENTIST' || user.role === 'ADMIN' 
        ? consultation.dentistNote 
        : null,
      assistantNote: user.role === 'ASSISTANT' || user.role === 'ADMIN' 
        ? consultation.assistantNote 
        : null,
      dentistName: consultation.dentist 
        ? `Dr. ${consultation.dentist.firstName} ${consultation.dentist.lastName}`
        : '',
      assistantName: consultation.assistant
        ? `${consultation.assistant.firstName} ${consultation.assistant.lastName}`
        : ''
    };
  }
  
  export async function updateConsultationNote(
    consultationId: string,
    noteType: 'dentist' | 'assistant',
    content: string
  ) {
    const { userId } = await auth();
    if (!userId) throw new Error('Utilisateur non authentifié');
  
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, role: true, firstName: true, lastName: true }
    });
  
    if (!user) throw new Error('Utilisateur non trouvé');
  
    // Vérification des permissions
    if (noteType === 'dentist' && user.role !== 'DENTIST' && user.role !== 'ADMIN') {
      throw new Error('Seuls les dentistes et administrateurs peuvent modifier la note dentiste');
    }
  
    if (noteType === 'assistant' && user.role !== 'ASSISTANT' && user.role !== 'ADMIN') {
      throw new Error('Seuls les assistants et administrateurs peuvent modifier la note assistant');
    }
  
    const updateData = {
      [`${noteType}Note`]: content,
      updatedAt: new Date(),
      ...(noteType === 'dentist' && { dentistId: user.id }),
      ...(noteType === 'assistant' && { assistantId: user.id })
    };
  
    const whereCondition = {
      id: consultationId,
      ...(user.role === 'ASSISTANT' && { assistantId: user.id }),
      ...(user.role === 'DENTIST' && { dentistId: user.id })
    };
  
    try {
      await prisma.consultation.update({
        where: whereCondition,
        data: updateData
      });
  
      revalidatePath(`/consultations/${consultationId}`);
      revalidatePath('/consultations');
  
      return {
        success: true,
        message: 'Note mise à jour avec succès',
        user: `${user.firstName} ${user.lastName}`
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la note:', error);
      throw new Error('Échec de la mise à jour de la note');
    }
  }

  export async function getConsultationById(id: string): Promise<Consultation> {
    const { userId } = await auth();
    if (!userId) throw new Error('Non autorisé');
  
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });
  
    if (!user) throw new Error('Utilisateur non trouvé');
  
    const consultation = await prisma.consultation.findUnique({
      where: {
          id,
          OR: [
            { assistantId: user.id },
            { dentistId: user.id },
            { createdById: user.id }
          ]
        },
        include: { 
          treatments: true,
          dentist: { select: { firstName: true, lastName: true } },
          assistant: { select: { firstName: true, lastName: true } }
        }
    });
  
    if (!consultation) throw new Error('Consultation non trouvée');
  
    return {
      ...consultation,
      treatments: consultation.treatments.map(t => ({
        ...t,
        status: t.status as 'UNPAID' | 'PAID' | 'PARTIAL'
      }))
    };
  }
export async function getConsultations(): Promise<Consultation[]> {
    const { userId } = await auth();
    if (!userId) throw new Error('Utilisateur non connecté');
  
    return await prisma.consultation.findMany({
      where: { assistantId: userId },
      include: { treatments: true },
      orderBy: { date: 'desc' }
    });
  }

export async function deleteConsultation(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Non autorisé');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  });

  if (!user) throw new Error('Utilisateur non trouvé');

  await prisma.consultation.delete({
    where: { id, assistantId: user.id }
  });

  revalidatePath('/consultations');
  redirect('/consultations');
}

export async function deleteAllConsultations() {
  const { userId } = await auth();
  if (!userId) throw new Error('Non autorisé');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  });

  if (!user) throw new Error('Utilisateur non trouvé');

  await prisma.consultation.deleteMany({
    where: { assistantId: user.id }
  });

  revalidatePath('/consultations');
  redirect('/consultations');
}
