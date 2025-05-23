import prisma from "@/lib/prisma";
import { offlineDB } from "@/lib/offlineDB";
import { SyncService } from "@/lib/syncService";

interface CreateAppointmentData {
  patientName: string;
  patientPhone: string;
  date: Date;
  reason: string;
  status?: string;
  clinicId: string;
  dentistId: string;
  createdById: string;
  consultationId?: string;
}

export class AppointmentService {
  static async createAppointment(data: CreateAppointmentData) {
    const appointmentData = {
      ...data,
      id: self.crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      syncStatus: 'pending' as const,
    };

    if (navigator.onLine) {
      try {
        const created = await prisma.appointment.create({
          data: {
            patientName: data.patientName,
            patientPhone: data.patientPhone,
            date: data.date,
            reason: data.reason,
            status: data.status || 'scheduled',
            clinicId: data.clinicId,
            consultationId: data.consultationId,
            dentistId: data.dentistId,
            createdById: data.createdById,
          },
        });

        // Mettre à jour le cache offline
        await offlineDB.appointments.put({
          ...created,
          syncStatus: 'synced',
          lastSynced: new Date().toISOString(),
        });

        return created;
      } catch (error) {
        console.error('Online creation failed, falling back to offline', error);
      }
    }

    // Fallback offline
    await offlineDB.appointments.add(appointmentData);
    return appointmentData;
  }

  static async getAppointments(clinicId: string, dateRange?: { start: Date; end: Date }) {
    try {
      // Essayer d'abord la base de données en ligne
      const onlineAppointments = await prisma.appointment.findMany({
        where: {
          clinicId,
          ...(dateRange && {
            date: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          }),
        },
        orderBy: { date: 'asc' },
      });

      // Mettre à jour le cache offline
      if (onlineAppointments.length > 0) {
        await offlineDB.appointments.bulkPut(
          onlineAppointments.map(apt => ({
            ...apt,
            syncStatus: 'synced',
            lastSynced: new Date().toISOString(),
          }))
        );
      }

      return onlineAppointments;
    } catch (error) {
      console.log('Online DB unavailable, falling back to offline DB');
    }

    // Fallback vers la base de données hors ligne
    let query = offlineDB.appointments.where('clinicId').equals(clinicId);

    if (dateRange) {
      query = query.and(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= dateRange.start && aptDate <= dateRange.end;
      });
    }

    return query.sortBy('date');
  }

  static async updateAppointmentStatus(id: string, status: string, clinicId: string) {
    const updateData = { status, updatedAt: new Date().toISOString() };

    if (navigator.onLine) {
      try {
        const updated = await prisma.appointment.update({
          where: { id, clinicId },
          data: { status },
        });

        // Mettre à jour le cache offline
        await offlineDB.appointments.update(id, {
          ...updated,
          syncStatus: 'synced',
          lastSynced: new Date().toISOString(),
        });

        return updated;
      } catch (error) {
        console.error('Online update failed, falling back to offline', error);
      }
    }

    // Fallback offline
    await offlineDB.appointments.update(id, {
      ...updateData,
      syncStatus: 'pending',
    });

    return { id, ...updateData };
  }

  static async deleteAppointment(id: string, clinicId: string) {
    if (navigator.onLine) {
      try {
        await prisma.appointment.delete({
          where: { id, clinicId },
        });

        // Supprimer du cache offline
        await offlineDB.appointments.delete(id);
        return true;
      } catch (error) {
        console.error('Online deletion failed, falling back to offline', error);
      }
    }

    // Fallback offline - marquer comme à supprimer
    await offlineDB.appointments.update(id, {
      syncStatus: 'deleted',
    });

    return true;
  }
}