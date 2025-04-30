'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';

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
}

// Authentification utilisateur
async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error('Non autorisé');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  });

  if (!user) throw new Error('Utilisateur non trouvé');
  return user;
}
// Dans action.ts, ajoutez cette fonction
export async function fetchConsultations() {
    const user = await getCurrentUser();
    
    const consultations = await prisma.consultation.findMany({
      where: { createdById: user.id },
      orderBy: { createdAt: 'desc' }
    });
  
    return consultations;
  }

// Récupérer tous les rendez-vous
export async function fetchAppointments(): Promise<Appointment[]> {
  const user = await getCurrentUser();

  const appointments = await prisma.appointment.findMany({
    where: {
      OR: [
        { dentistId: user.id },
        { createdById: user.id }
      ]
    },
    include: {
      consultation: { select: { id: true, patientName: true, patientPhone: true } },
      dentist: { select: { id: true, firstName: true, lastName: true } }
    },
    orderBy: { date: 'asc' }
  });

  return appointments.map(appointment => ({
    ...appointment,
    status: appointment.status as Appointment['status']
  }));
}

// Ajouter un rendez-vous
export async function addAppointment(formData: FormData) {
    const user = await getCurrentUser();  // c'est l'assistant
  
    const consultationId = formData.get('consultationId')?.toString();
    const date = formData.get('date')?.toString();
    const reason = formData.get('reason')?.toString() || "";
  
    if (!consultationId) throw new Error("Consultation non sélectionnée.");
    if (!date) throw new Error("Date invalide.");

const consultation = await prisma.consultation.findUnique({
  where: { id: consultationId }
});

if (!consultation) throw new Error("Consultation introuvable.");

await prisma.appointment.create({
  data: {
    consultationId: consultation.id,
    patientName: consultation.patientName,
    patientPhone: consultation.patientPhone,
    date: new Date(date),
    reason: reason,
    status: 'scheduled',
    dentistId: consultation.assistantId,  // ici si assistantId est censé être le dentiste sinon ajuster
    createdById: user.id
  }
});

  revalidatePath('/appointments');
  redirect('/appointments');
}

// Mettre à jour un rendez-vous
export async function updateAppointment(id: string, data: Partial<AppointmentInput>) {
  const user = await getCurrentUser();

  await prisma.appointment.update({
    where: { id, OR: [{ dentistId: user.id }, { createdById: user.id }] },
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
    where: { id, OR: [{ dentistId: user.id }, { createdById: user.id }] },
    include: {
      consultation: { select: { id: true, patientName: true, patientPhone: true } },
      dentist: { select: { id: true, firstName: true, lastName: true } }
    }
  });

  if (!appointment) throw new Error('Rendez-vous non trouvé');

  return { ...appointment, status: appointment.status as Appointment['status'] };
}

// Supprimer un rendez-vous
export async function deleteAppointment(id: string) {
  const user = await getCurrentUser();

  await prisma.appointment.delete({
    where: { id, OR: [{ dentistId: user.id }, { createdById: user.id }] }
  });

  revalidatePath('/appointments');
  redirect('/appointments');
}

// Supprimer tous les rendez-vous
export async function deleteAllAppointments() {
  const user = await getCurrentUser();

  await prisma.appointment.deleteMany({
    where: { OR: [{ dentistId: user.id }, { createdById: user.id }] }
  });

  revalidatePath('/appointments');
  redirect('/appointments');
}
