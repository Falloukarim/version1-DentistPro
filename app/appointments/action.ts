'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

// Types d'entrées
interface AppointmentInput {
  id?: string;
  consultationId: string;
  patientName: string;
  patientPhone: string;
  date: Date | string;
  reason: string;
  status?: 'scheduled' | 'cancelled' | 'completed' | 'no_show';
  dentistId: string;
  createdById: string;
  clinicId: string;
  createdAt?: Date | string;
}

// Structure retournée
export interface Appointment {
  id: string;
  consultationId: string;
  patientName: string;
  patientPhone: string;
  date: Date;
  reason: string;
  status: 'scheduled' | 'cancelled' | 'completed' | 'no_show';
  dentistId: string;
  createdById: string;
  clinicId: string;
  createdAt: Date;
  consultation: {
    id: string;
    patientName: string;
    patientPhone: string;
  };
  dentist: {
    id: string;
    firstName: string;
    lastName: string;
  };
  clinic?: {
    id: string;
    name: string;
  };
}

// Authentification utilisateur
async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error('Non autorisé');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { clinic: true }
  });

  if (!user) throw new Error('Utilisateur non trouvé');
  if (!user.clinicId && user.role !== 'SUPER_ADMIN') {
    throw new Error('Aucune clinique assignée');
  }
  return user;
}

// Fonction pour récupérer les consultations
export async function fetchConsultations() {
  const user = await getCurrentUser();

  const whereClause = user.role === 'SUPER_ADMIN' 
    ? {}
    : { clinicId: user.clinicId };

  return await prisma.consultation.findMany({
    where: {
      ...whereClause,
      OR: [
        { assistantId: user.id },
        { dentistId: user.id },
        { createdById: user.id }
      ]
    },
    select: {
      id: true,
      patientName: true,
      patientPhone: true,
      createdAt: true,
      dentistId: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

// Ajouter un rendez-vous
export async function addAppointment(formData: FormData) {
  const user = await getCurrentUser();
  
  const consultationId = formData.get('consultationId')?.toString();
  const date = formData.get('date')?.toString();
  const reason = formData.get('reason')?.toString() || "";

  // Validation des données
  if (!consultationId) throw new Error("Consultation non sélectionnée.");
  if (!date) throw new Error("Date invalide.");
  if (!user.clinicId && user.role !== 'SUPER_ADMIN') {
    throw new Error("Aucune clinique assignée.");
  }

  // Vérification de l'existence de la consultation
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId }
  });
  if (!consultation) throw new Error("Consultation introuvable.");

  try {
    // Création du rendez-vous
    await prisma.appointment.create({
      data: {
        consultationId: consultation.id,
        patientName: consultation.patientName,
        patientPhone: consultation.patientPhone,
        date: new Date(date),
        reason: reason,
        status: 'scheduled',
        dentistId: consultation.dentistId || user.id,
        createdById: user.id,
        clinicId: user.clinicId!
      }
    });

    revalidatePath('/appointments');
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la création du rendez-vous:", error);
    throw new Error("Échec de la création du rendez-vous");
  }
}

// Récupérer tous les rendez-vous
export async function fetchAppointments(): Promise<Appointment[]> {
  const user = await getCurrentUser();

  const whereClause = user.role === 'SUPER_ADMIN' 
    ? {}
    : { clinicId: user.clinicId };

  const appointments = await prisma.appointment.findMany({
    where: {
      ...whereClause,
      OR: [
        { dentistId: user.id },
        { createdById: user.id }
      ]
    },
    include: {
      consultation: { select: { id: true, patientName: true, patientPhone: true } },
      dentist: { select: { id: true, firstName: true, lastName: true } },
      clinic: user.role === 'SUPER_ADMIN' ? { select: { name: true } } : false
    },
    orderBy: { date: 'asc' }
  });

  return appointments.map(appointment => ({
    ...appointment,
    status: appointment.status as Appointment['status']
  }));
}

// Mettre à jour un rendez-vous
export async function updateAppointment(id: string, data: Partial<AppointmentInput>) {
  const user = await getCurrentUser();

  await prisma.appointment.update({
    where: { 
      id, 
      OR: [
        { dentistId: user.id },
        { createdById: user.id }
      ],
      clinicId: user.role !== 'SUPER_ADMIN' ? user.clinicId : undefined
    },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined
    }
  });

  revalidatePath('/appointments');
  redirect(`/appointments/${id}`);
}

// Obtenir un rendez-vous par ID
export async function getAppointmentById(id: string): Promise<Appointment> {
  const user = await getCurrentUser();

  const appointment = await prisma.appointment.findUnique({
    where: { 
      id, 
      OR: [
        { dentistId: user.id },
        { createdById: user.id }
      ],
      clinicId: user.role !== 'SUPER_ADMIN' ? user.clinicId : undefined
    },
    include: {
      consultation: { select: { id: true, patientName: true, patientPhone: true } },
      dentist: { select: { id: true, firstName: true, lastName: true } },
      clinic: true
    }
  });

  if (!appointment) throw new Error('Rendez-vous non trouvé');

  return { 
    ...appointment,
    status: appointment.status as Appointment['status'],
    clinic: appointment.clinic || undefined
  };
}

// Supprimer un rendez-vous
export async function deleteAppointment(id: string) {
  const user = await getCurrentUser();

  await prisma.appointment.delete({
    where: { 
      id, 
      OR: [
        { dentistId: user.id },
        { createdById: user.id }
      ],
      clinicId: user.role !== 'SUPER_ADMIN' ? user.clinicId : undefined
    }
  });

  revalidatePath('/appointments');
  redirect('/appointments');
}

// Supprimer tous les rendez-vous
export async function deleteAllAppointments() {
  const user = await getCurrentUser();

  await prisma.appointment.deleteMany({
    where: { 
      OR: [
        { dentistId: user.id },
        { createdById: user.id }
      ],
      clinicId: user.role !== 'SUPER_ADMIN' ? user.clinicId : undefined
    }
  });

  revalidatePath('/appointments');
  redirect('/appointments');
}