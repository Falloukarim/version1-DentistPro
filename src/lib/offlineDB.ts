import Dexie, { Table } from 'dexie';
import { Consultation, Treatment, Payment, User, Appointment } from '@prisma/client';

interface OfflineConsultation extends Consultation {
  syncStatus: 'synced' | 'pending';
  lastSynced?: string;
}

interface OfflineTreatment extends Treatment {
  syncStatus: 'synced' | 'pending';
  lastSynced?: string;
}

interface OfflinePayment extends Payment {
  syncStatus: 'synced' | 'pending';
  lastSynced?: string;
}

interface OfflineUser extends User {
  syncStatus: 'synced' | 'pending';
  lastSynced?: string;
}

interface OfflineAppointment extends Appointment {
  syncStatus: 'synced' | 'pending';
  lastSynced?: string;
}

class OfflineDatabase extends Dexie {
  consultations!: Table<OfflineConsultation, string>;
  treatments!: Table<OfflineTreatment, string>;
  payments!: Table<OfflinePayment, string>;
  appointments!: Table<OfflineAppointment, string>;
  users!: Table<OfflineUser, string>;

  constructor() {
    super('DentistudioOfflineDB');

    this.version(1).stores({
      consultations: 'id, clinicId, syncStatus, [clinicId+syncStatus]',
      treatments: 'id, consultationId, syncStatus, [clinicId+syncStatus]',
      payments: 'id, consultationId, treatmentId, syncStatus, [clinicId+syncStatus]',
      appointments: 'id, consultationId, clinicId, syncStatus, [clinicId+syncStatus]',
      users: 'id, clerkUserId, clinicId, syncStatus'
    });

    // Gestion du debug en développement
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).offlineDB = this;
      (window as any).clearOfflineDB = () => this.clearDatabase();
    }
  }

  async getPendingSyncItems() {
    await this.open();
    const [consultations, treatments, payments, appointments] = await Promise.all([
      this.consultations.where('syncStatus').equals('pending').toArray(),
      this.treatments.where('syncStatus').equals('pending').toArray(),
      this.payments.where('syncStatus').equals('pending').toArray(),
      this.appointments.where('syncStatus').equals('pending').toArray()
    ]);
    return { consultations, treatments, payments, appointments };
  }

  async clearDatabase() {
    try {
      await this.delete();
      console.log('Database cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear database:', error);
      return false;
    }
  }

  async safeOpen() {
    try {
      await this.open();
      return true;
    } catch (error) {
      if (error.name === 'UpgradeError') {
        console.warn('Database schema changed, clearing database...');
        await this.clearDatabase();
        await this.open();
        return true;
      }
      console.error('Failed to open database:', error);
      return false;
    }
  }
}

export const offlineDB = new OfflineDatabase();
