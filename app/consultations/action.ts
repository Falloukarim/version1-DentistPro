'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

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
  treatments?: Treatment[];
  assistantId: string | null;
  dentistId?: string | null;
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
  description?: string;
}

// Helper de conversion pour updateConsultation
interface UpdateData {
  patientName?: string;
  patientPhone?: string;
  patientAddress?: string | null;
  patientAge?: number | null;
  patientGender?: string | null;
  date?: Date;
  description?: string | null;
  isPaid?: boolean;
  updatedAt: Date;
}

function toUpdateData(data: Partial<ConsultationInput>): UpdateData {
  return {
    ...data,
    date: data.date ? (data.date instanceof Date ? data.date : new Date(data.date)) : undefined,
    updatedAt: new Date(),
    patientAddress: data.patientAddress === null ? null : data.patientAddress,
    patientAge: data.patientAge === null ? null : data.patientAge,
    patientGender: data.patientGender === null ? null : data.patientGender,
    description: data.description === null ? null : data.description
  };
}


  export async function getAvailableDentists(): Promise<Dentist[]> {
    try {
      const { userId } = await auth();

      if (!userId) {
        throw new Error("Utilisateur non authentifié");
      }
      
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        select: { clinicId: true, role: true }
      });
      
  
      const whereClause = user?.role === Role.SUPER_ADMIN
        ? { role: Role.DENTIST }
        : {
            role: Role.DENTIST,
            clinicId: user?.clinicId ?? undefined // éviter null si problématique
          };
  
      return await prisma.user.findMany({
        where: whereClause,
        select: { id: true, firstName: true, lastName: true }
      });
    } catch (error) {
      console.error('Erreur:', error);
      throw new Error('Impossible de charger les dentistes');
    }
  }
  
  export async function addConsultation(
  prevState: { error?: string; success?: boolean; id?: string } | null,
  formData: FormData | null
) {
  if (!formData) return prevState;

  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Non autorisé');

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { clinic: true },
    });

    if (!user) throw new Error('Utilisateur non trouvé');
    if (!user.clinicId && user.role !== 'SUPER_ADMIN') {
      throw new Error('Aucune clinique assignée');
    }

    const dentistId = formData.get('dentistId') as string;
    if (!dentistId) throw new Error('Veuillez sélectionner un dentiste');

    const patientName = formData.get('patientName') as string;
    if (!patientName || patientName.trim().length < 2) {
      throw new Error('Le nom du patient doit contenir au moins 2 caractères');
    }

    const patientPhone = formData.get('patientPhone') as string;
    const phoneRegex = /^(77|76|70|78|75)[0-9]{7}$/;
    if (!phoneRegex.test(patientPhone)) {
      throw new Error('Numéro Sénégalais invalide');
    }

    const date = formData.get('date') as string;
    if (!date) throw new Error('Veuillez sélectionner une date');

    const isPaid = formData.get('isPaid') === 'true';
    const consultationFee = Number(formData.get('consultationFee')) || 3000;

    // Utilisation correcte de la transaction Prisma
    const consultation = await prisma.$transaction(async (tx) => {
      // Création de la consultation
      const consultation = await tx.consultation.create({
        data: {
          patientName,
          patientPhone,
          patientAddress: formData.get('patientAddress') as string || null,
          patientAge: formData.get('patientAge')
            ? parseInt(formData.get('patientAge') as string)
            : null,
          patientGender: formData.get('patientGender') as string || null,
          date: new Date(date),
          description: formData.get('description') as string || null,
          isPaid,
          clinic: { connect: { id: user.clinicId! } },
          assistant: { connect: { id: user.id } },
          dentist: { connect: { id: dentistId } },
          createdBy: { connect: { id: user.id } },
        },
      });

      // Création automatique d'un traitement de consultation
      const treatment = await tx.treatment.create({
        data: {
          type: "Consultation",
          amount: consultationFee,
          paidAmount: isPaid ? consultationFee : 0,
          remainingAmount: isPaid ? 0 : consultationFee,
          status: isPaid ? "PAID" : "UNPAID",
          consultation: { connect: { id: consultation.id } },
          clinic: { connect: { id: user.clinicId! } }
        }
      });

      if (isPaid) {
        await tx.payment.create({
          data: {
            amount: consultationFee,
            paymentMethod: 'CASH',
            paymentDate: new Date(),
            consultation: { connect: { id: consultation.id } },
            treatment: { connect: { id: treatment.id } },
            createdBy: { connect: { id: user.id } },
            clinic: { connect: { id: user.clinicId! } },
          },
        });
      }

      return consultation;
    });

    revalidatePath('/consultations');
    return { success: true, id: consultation.id };
    
  } catch (error) {
    console.error('Erreur:', error);
    return {
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue',
    };
  }
}
  
  // Fonction pour obtenir les consultations selon le rôle
  export async function fetchConsultations(): Promise<Consultation[]> {
    const { userId } = await auth();
  
    if (!userId) {
      throw new Error("Utilisateur non authentifié");
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, clinicId: true, role: true }
    });
  
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
  
    // Création de la clause where de manière sécurisée
    const where: Record<string, any> = {};
  
    if (user.role !== 'SUPER_ADMIN' && user.clinicId) {
      where.clinicId = user.clinicId;
    }
  
    if (user.role === 'ASSISTANT') {
      where.assistantId = user.id;
    } else if (user.role === 'DENTIST') {
      where.dentistId = user.id;
    }
  
    const consultations = await prisma.consultation.findMany({
      where,
      include: { 
        treatments: true,
        clinic: user.role === 'SUPER_ADMIN' ? true : false
      },
      orderBy: { date: 'desc' }
    });
  
    // Transformation pour garantir le type Consultation
    return consultations.map((consultation: { treatments: any; }) => ({
      ...consultation,
      treatments: consultation.treatments || [] // Garantit un tableau même si undefined
    }));
  }

  export async function updateConsultation(id: string, data: Partial<ConsultationInput>) {
    const { userId } = await auth();
    if (!userId) throw new Error('Non autorisé');
  
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });
  
    if (!user) throw new Error('Utilisateur non trouvé');
  
    // Vérifier si la consultation existe et que l'utilisateur a les droits
    const existingConsultation = await prisma.consultation.findUnique({
      where: { id, assistantId: user.id }
    });
  
    if (!existingConsultation) {
      throw new Error('Consultation non trouvée ou droits insuffisants');
    }
  
    // Conversion des données avec notre helper
    const updateData = toUpdateData(data);
  
    try {
      await prisma.consultation.update({
        where: { id, assistantId: user.id },
        data: updateData
      });
  
      revalidatePath('/consultations');
      redirect(`/consultations/${id}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw new Error('Échec de la mise à jour de la consultation');
    }
  }
  export async function getTreatmentById(id: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Non autorisé');
  
    return await prisma.treatment.findUnique({
      where: { id },
      include: {
        consultation: {
          select: {
            patientName: true,
            patientPhone: true,
          },
        },
        clinic: {
          select: {
            name: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            paymentDate: true,
          },
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
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

  export async function addTreatment(prevState: any, formData: FormData) {
    try {
      const data = {
        consultationId: formData.get('consultationId') as string,
        type: formData.get('type') as string,
        amount: Number(formData.get('amount')),
        paidAmount: Number(formData.get('paidAmount')) || 0,
        status: formData.get('status') as 'UNPAID' | 'PAID' | 'PARTIAL'
      };
  
      // Validation des entrées
      if (!data.consultationId) {
        return { error: 'ID de consultation requis' };
      }
      if (!data.type) {
        return { error: 'Type de traitement requis' };
      }
      if (isNaN(data.amount)) {
        return { error: 'Montant invalide' };
      }
      if (isNaN(data.paidAmount)) {
        return { error: 'Montant payé invalide' };
      }
      if (!['UNPAID', 'PAID', 'PARTIAL'].includes(data.status)) {
        return { error: 'Statut de paiement invalide' };
      }
  
      const { userId } = await auth();
      if (!userId) {
        return { error: 'Non autorisé' };
      }
  
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        include: { clinic: true }
      });
  
      if (!user) {
        return { error: 'Utilisateur non trouvé' };
      }
      if (!user.clinicId && user.role !== 'SUPER_ADMIN') {
        return { error: 'Aucune clinique assignée' };
      }
  
      const treatment = await prisma.treatment.create({
        data: {
          type: data.type,
          amount: data.amount,
          paidAmount: data.paidAmount,
          remainingAmount: data.amount - data.paidAmount,
          status: data.status,
          consultation: { connect: { id: data.consultationId } },
          clinic: { connect: { id: user.clinicId! } }
        }
      });
  
      if (data.paidAmount > 0) {
        await prisma.payment.create({
          data: {
            amount: data.paidAmount,
            paymentMethod: 'CASH',
            paymentDate: new Date(),
            treatment: { connect: { id: treatment.id } },
            createdBy: { connect: { id: user.id } },
            clinic: { connect: { id: user.clinicId! } }
          }
        });
      }
  
      revalidatePath(`/consultations/${data.consultationId}`);
      return { success: true, id: treatment.id };
    } catch (error) {
      console.error('Error creating treatment:', error);
      return { error: 'Échec de la création du traitement' };
    }
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
      treatments: consultation.treatments.map((t: { status: string; }) => ({
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
