import prisma from '@/lib/prisma';
import { offlineDB } from '@/lib/offlineDB';

export class SyncService {
  static async syncAll(clinicId: string) {
    if (typeof window === 'undefined') return false;
    if (!navigator.onLine) return false;

    try {
      await offlineDB.open(); // S'assurer que la DB est ouverte
      
      await Promise.all([
        this.syncConsultations(clinicId),
        this.syncAppointments(clinicId),
        this.syncPayments(clinicId),
        this.syncTreatments(clinicId),
      ]);

      return true;
    } catch (error) {
      console.error('Global sync failed:', error);
      return false;
    }
  }

  private static async syncConsultations(clinicId: string) {
    try {
      const pendingConsultations = await offlineDB.consultations
        .where('[clinicId+syncStatus]')
        .equals([clinicId, 'pending'])
        .toArray();

      for (const consultation of pendingConsultations) {
        try {
          const created = await prisma.consultation.create({
            data: {
              patientName: consultation.patientName,
              patientPhone: consultation.patientPhone,
              patientAddress: consultation.patientAddress,
              patientAge: consultation.patientAge,
              patientGender: consultation.patientGender,
              dentistNote: consultation.dentistNote,
              assistantNote: consultation.assistantNote,
              description: consultation.description,
              isPaid: consultation.isPaid,
              clinicId: consultation.clinicId,
              createdById: consultation.createdById,
              dentistId: consultation.dentistId,
              assistantId: consultation.assistantId,
              date: new Date(consultation.date),
              createdAt: new Date(consultation.createdAt),
              updatedAt: new Date(consultation.updatedAt),
            },
          });

          // Mettre à jour les références
          await offlineDB.appointments
            .where('consultationId')
            .equals(consultation.id)
            .modify({ consultationId: created.id });

          await offlineDB.treatments
            .where('consultationId')
            .equals(consultation.id)
            .modify({ consultationId: created.id });

          await offlineDB.payments
            .where('consultationId')
            .equals(consultation.id)
            .modify({ consultationId: created.id });

          // Supprimer de la base hors ligne
          await offlineDB.consultations.delete(consultation.id);
        } catch (error) {
          console.error('Failed to sync consultation:', consultation.id, error);
        }
      }
    } catch (error) {
      console.error('Error in syncConsultations:', error);
    }
  }

  private static async syncAppointments(clinicId: string) {
    const pendingAppointments = await offlineDB.appointments
      .where('[clinicId+syncStatus]')
      .equals([clinicId, 'pending'])
      .toArray();

    for (const appointment of pendingAppointments) {
      try {
        // Vérifier les conflits avant synchronisation
        const conflict = await prisma.appointment.findFirst({
          where: {
            dentistId: appointment.dentistId,
            date: new Date(appointment.date),
            status: 'scheduled',
            clinicId: appointment.clinicId,
            NOT: { id: appointment.id },
          },
        });

        if (conflict) {
          console.warn('Appointment conflict detected:', appointment.id);
          continue;
        }

        const created = await prisma.appointment.create({
          data: {
            patientName: appointment.patientName,
            patientPhone: appointment.patientPhone,
            date: new Date(appointment.date),
            reason: appointment.reason,
            status: appointment.status,
            clinicId: appointment.clinicId,
            consultationId: appointment.consultationId,
            dentistId: appointment.dentistId,
            createdById: appointment.createdById,
            createdAt: new Date(appointment.createdAt),
          },
        });

        await offlineDB.appointments.delete(appointment.id!);
      } catch (error) {
        console.error('Failed to sync appointment:', appointment.id, error);
      }
    }
  }

  private static async syncPayments(clinicId: string) {
    const pendingPayments = await offlineDB.payments
      .where('[clinicId+syncStatus]')
      .equals([clinicId, 'pending'])
      .toArray();

    for (const payment of pendingPayments) {
      try {
        const created = await prisma.payment.create({
          data: {
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            paymentDate: new Date(payment.paymentDate),
            reference: payment.reference,
            notes: payment.notes,
            clinicId: payment.clinicId,
            consultationId: payment.consultationId,
            treatmentId: payment.treatmentId,
            createdById: payment.createdById,
            createdAt: new Date(payment.createdAt),
            updatedAt: new Date(payment.updatedAt),
          },
        });

        if (payment.treatmentId) {
          await this.syncTreatmentPaymentStatus(payment.treatmentId);
        }

        await offlineDB.payments.delete(payment.id!);
      } catch (error) {
        console.error('Failed to sync payment:', payment.id, error);
      }
    }
  }

  private static async syncTreatments(clinicId: string) {
    const pendingTreatments = await offlineDB.treatments
      .where('[clinicId+syncStatus]')
      .equals([clinicId, 'pending'])
      .toArray();

    for (const treatment of pendingTreatments) {
      try {
        const created = await prisma.treatment.create({
          data: {
            type: treatment.type,
            amount: treatment.amount,
            paidAmount: treatment.paidAmount,
            remainingAmount: treatment.remainingAmount,
            status: treatment.status,
            clinicId: treatment.clinicId,
            consultationId: treatment.consultationId,
            createdAt: new Date(treatment.createdAt),
            updatedAt: new Date(treatment.updatedAt),
          },
        });

        // Mettre à jour les références dans les paiements
        await offlineDB.payments
          .where('treatmentId')
          .equals(treatment.id!)
          .modify({ treatmentId: created.id });

        await offlineDB.treatments.delete(treatment.id!);
      } catch (error) {
        console.error('Failed to sync treatment:', treatment.id, error);
      }
    }
  }

  private static async syncTreatmentPaymentStatus(treatmentId: string) {
    try {
      const treatment = await prisma.treatment.findUnique({
        where: { id: treatmentId },
      });

      if (!treatment) return;

      const payments = await prisma.payment.findMany({
        where: { treatmentId },
      });

      const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingAmount = treatment.amount - paidAmount;
      const status = remainingAmount <= 0 ? 'PAID' : 
                    paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

      await prisma.treatment.update({
        where: { id: treatmentId },
        data: {
          paidAmount,
          remainingAmount,
          status,
        },
      });

      // Mise à jour du cache
      await offlineDB.treatments.update(treatmentId, {
        paidAmount,
        remainingAmount,
        status,
        syncStatus: 'synced',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to sync treatment payment status:', treatmentId, error);
    }
  }

  static startSyncListeners(clinicId: string) {
    if (typeof window === 'undefined') return () => {};

    const sync = () => {
      if (navigator.onLine) {
        this.syncAll(clinicId).catch(console.error);
      }
    };

    window.addEventListener('online', sync);
    const interval = setInterval(sync, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('online', sync);
      clearInterval(interval);
    };
  }
}