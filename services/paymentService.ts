import prisma from "@/lib/prisma";
import { offlineDB } from "@/lib/offlineDB";
import { SyncService } from "@/lib/syncService";

interface CreatePaymentData {
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  reference?: string;
  notes?: string;
  clinicId: string;
  consultationId?: string;
  treatmentId?: string;
  createdById: string;
}

export class PaymentService {
  static async createPayment(data: CreatePaymentData) {
    const paymentData = {
      ...data,
      id: self.crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending' as const,
    };

    if (navigator.onLine) {
      try {
        const created = await prisma.payment.create({
          data: {
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            paymentDate: data.paymentDate,
            reference: data.reference,
            notes: data.notes,
            clinicId: data.clinicId,
            consultationId: data.consultationId,
            treatmentId: data.treatmentId,
            createdById: data.createdById,
          },
        });

        // Mettre à jour le cache offline
        await offlineDB.payments.put({
          ...created,
          syncStatus: 'synced',
          lastSynced: new Date().toISOString(),
        });

        // Mettre à jour le statut du traitement si nécessaire
        if (data.treatmentId) {
          await SyncService.syncTreatmentPaymentStatus(data.treatmentId);
        }

        return created;
      } catch (error) {
        console.error('Online creation failed, falling back to offline', error);
      }
    }

    // Fallback offline
    await offlineDB.payments.add(paymentData);

    if (data.treatmentId) {
      await this.updateOfflineTreatmentStatus(data.treatmentId);
    }

    return paymentData;
  }

  private static async updateOfflineTreatmentStatus(treatmentId: string) {
    const treatment = await offlineDB.treatments.get(treatmentId);
    if (!treatment) return;

    const payments = await offlineDB.payments
      .where('treatmentId')
      .equals(treatmentId)
      .toArray();

    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = treatment.amount - paidAmount;
    const status = remainingAmount <= 0 ? 'PAID' : 
                  paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

    await offlineDB.treatments.update(treatmentId, {
      paidAmount,
      remainingAmount,
      status,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });
  }

  static async getPayments(clinicId: string, filters?: {
    dateRange?: { start: Date; end: Date };
    treatmentId?: string;
    consultationId?: string;
  }) {
    try {
      // Essayer d'abord la base de données en ligne
      const where: any = { clinicId };
      
      if (filters?.dateRange) {
        where.paymentDate = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end,
        };
      }
      
      if (filters?.treatmentId) {
        where.treatmentId = filters.treatmentId;
      }
      
      if (filters?.consultationId) {
        where.consultationId = filters.consultationId;
      }

      const onlinePayments = await prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
      });

      // Mettre à jour le cache offline
      if (onlinePayments.length > 0) {
        await offlineDB.payments.bulkPut(
          onlinePayments.map(p => ({
            ...p,
            syncStatus: 'synced',
            lastSynced: new Date().toISOString(),
          }))
        );
      }

      return onlinePayments;
    } catch (error) {
      console.log('Online DB unavailable, falling back to offline DB');
    }

    // Fallback vers la base de données hors ligne
    let query = offlineDB.payments.where('clinicId').equals(clinicId);

    if (filters?.dateRange) {
      query = query.and(p => {
        const paymentDate = new Date(p.paymentDate);
        return paymentDate >= filters.dateRange!.start && paymentDate <= filters.dateRange!.end;
      });
    }

    if (filters?.treatmentId) {
      query = query.and(p => p.treatmentId === filters.treatmentId);
    }

    if (filters?.consultationId) {
      query = query.and(p => p.consultationId === filters.consultationId);
    }

    return query.reverse().sortBy('paymentDate');
  }

  static async getPaymentById(id: string, clinicId: string) {
    try {
      // Essayer d'abord la base de données en ligne
      const onlinePayment = await prisma.payment.findUnique({
        where: { id, clinicId },
      });

      if (onlinePayment) {
        // Mettre à jour le cache offline
        await offlineDB.payments.put({
          ...onlinePayment,
          syncStatus: 'synced',
          lastSynced: new Date().toISOString(),
        });

        return onlinePayment;
      }
    } catch (error) {
      console.log('Online DB unavailable, falling back to offline DB');
    }

    // Fallback vers la base de données hors ligne
    const offlinePayment = await offlineDB.payments.get(id);
    if (!offlinePayment || offlinePayment.clinicId !== clinicId) {
      return null;
    }

    return offlinePayment;
  }

  static async deletePayment(id: string, clinicId: string) {
    if (navigator.onLine) {
      try {
        const payment = await prisma.payment.delete({
          where: { id, clinicId },
        });

        // Supprimer du cache offline
        await offlineDB.payments.delete(id);

        // Mettre à jour le statut du traitement si nécessaire
        if (payment.treatmentId) {
          await SyncService.syncTreatmentPaymentStatus(payment.treatmentId);
        }

        return true;
      } catch (error) {
        console.error('Online deletion failed, falling back to offline', error);
      }
    }

    // Fallback offline - marquer comme à supprimer
    const payment = await offlineDB.payments.get(id);
    if (!payment) return false;

    await offlineDB.payments.update(id, {
      syncStatus: 'deleted',
    });

    if (payment.treatmentId) {
      await this.updateOfflineTreatmentStatus(payment.treatmentId);
    }

    return true;
  }
}