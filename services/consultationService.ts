import prisma from "@/lib/prisma";
import { offlineDB } from "@/lib/offlineDB";
import { SyncService } from "@/lib/syncService";

interface CreateConsultationData {
  patientName: string;
  patientPhone: string;
  patientAddress?: string;
  patientAge?: number;
  patientGender?: string;
  dentistNote?: string;
  assistantNote?: string;
  description?: string;
  isPaid?: boolean;
  clinicId: string;
  createdById: string;
  dentistId?: string;
  assistantId?: string;
  date?: Date;
}

export class ConsultationService {
  static async createConsultation(data: CreateConsultationData) {
    const consultationData = {
      ...data,
      id: self.crypto.randomUUID(),
      date: data.date?.toISOString() || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPaid: data.isPaid || false,
      syncStatus: 'pending' as const,
    };

    if (navigator.onLine) {
      try {
        const created = await prisma.consultation.create({
          data: {
            patientName: data.patientName,
            patientPhone: data.patientPhone,
            patientAddress: data.patientAddress,
            patientAge: data.patientAge,
            patientGender: data.patientGender,
            dentistNote: data.dentistNote,
            assistantNote: data.assistantNote,
            description: data.description,
            isPaid: data.isPaid || false,
            clinicId: data.clinicId,
            createdById: data.createdById,
            dentistId: data.dentistId,
            assistantId: data.assistantId,
            date: data.date || new Date(),
          },
        });

        // Mettre à jour le cache offline
        await offlineDB.consultations.put({
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
    await offlineDB.consultations.add(consultationData);
    return consultationData;
  }

  static async getConsultations(clinicId: string, filters?: {
    patientName?: string;
    patientPhone?: string;
    dateRange?: { start: Date; end: Date };
  }) {
    try {
      // Essayer d'abord la base de données en ligne
      const where: any = { clinicId };
      
      if (filters?.patientName) {
        where.patientName = { contains: filters.patientName, mode: 'insensitive' };
      }
      
      if (filters?.patientPhone) {
        where.patientPhone = { contains: filters.patientPhone };
      }
      
      if (filters?.dateRange) {
        where.date = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end,
        };
      }

      const onlineConsultations = await prisma.consultation.findMany({
        where,
        orderBy: { date: 'desc' },
      });

      // Mettre à jour le cache offline
      if (onlineConsultations.length > 0) {
        await offlineDB.consultations.bulkPut(
          onlineConsultations.map(cons => ({
            ...cons,
            syncStatus: 'synced',
            lastSynced: new Date().toISOString(),
          }))
        );
      }

      return onlineConsultations;
    } catch (error) {
      console.log('Online DB unavailable, falling back to offline DB');
    }

    // Fallback vers la base de données hors ligne
    let query = offlineDB.consultations.where('clinicId').equals(clinicId);

    if (filters?.patientName) {
      const searchTerm = filters.patientName.toLowerCase();
      query = query.and(cons => 
        cons.patientName.toLowerCase().includes(searchTerm)
      );
    }

    if (filters?.patientPhone) {
      query = query.and(cons => 
        cons.patientPhone.includes(filters.patientPhone)
      );
    }

    if (filters?.dateRange) {
      query = query.and(cons => {
        const consDate = new Date(cons.date);
        return consDate >= filters.dateRange!.start && consDate <= filters.dateRange!.end;
      });
    }

    return query.reverse().sortBy('date');
  }

  static async getConsultationById(id: string, clinicId: string) {
    try {
      // Essayer d'abord la base de données en ligne
      const onlineConsultation = await prisma.consultation.findUnique({
        where: { id, clinicId },
        include: {
          treatments: true,
          payments: true,
          appointments: true,
        },
      });

      if (onlineConsultation) {
        // Mettre à jour le cache offline
        await offlineDB.consultations.put({
          ...onlineConsultation,
          syncStatus: 'synced',
          lastSynced: new Date().toISOString(),
        });

        // Mettre à jour les traitements associés
        if (onlineConsultation.treatments) {
          await offlineDB.treatments.bulkPut(
            onlineConsultation.treatments.map(t => ({
              ...t,
              syncStatus: 'synced',
              lastSynced: new Date().toISOString(),
            }))
          );
        }

        // Mettre à jour les paiements associés
        if (onlineConsultation.payments) {
          await offlineDB.payments.bulkPut(
            onlineConsultation.payments.map(p => ({
              ...p,
              syncStatus: 'synced',
              lastSynced: new Date().toISOString(),
            }))
          );
        }

        return onlineConsultation;
      }
    } catch (error) {
      console.log('Online DB unavailable, falling back to offline DB');
    }

    // Fallback vers la base de données hors ligne
    const offlineConsultation = await offlineDB.consultations.get(id);
    if (!offlineConsultation || offlineConsultation.clinicId !== clinicId) {
      return null;
    }

    const treatments = await offlineDB.treatments
      .where('consultationId')
      .equals(id)
      .toArray();

    const payments = await offlineDB.payments
      .where('consultationId')
      .equals(id)
      .toArray();

    const appointments = await offlineDB.appointments
      .where('consultationId')
      .equals(id)
      .toArray();

    return {
      ...offlineConsultation,
      treatments,
      payments,
      appointments,
    };
  }

  static async updateConsultation(
    id: string,
    clinicId: string,
    data: Partial<CreateConsultationData>
  ) {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (navigator.onLine) {
      try {
        const updated = await prisma.consultation.update({
          where: { id, clinicId },
          data,
        });

        // Mettre à jour le cache offline
        await offlineDB.consultations.update(id, {
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
    await offlineDB.consultations.update(id, {
      ...updateData,
      syncStatus: 'pending',
    });

    return { id, ...updateData };
  }
}