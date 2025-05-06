// app/admin/super-admin/page.tsx
import { getClinics, getClinicUsers } from '../../actions/clinic.actions';
import { getCurrentUser } from '../../../src/lib/auth';
import { redirect } from 'next/navigation';
import ClinicManagement from './components/ClinicManagement';
import { Role } from '@prisma/client';

export default async function SuperAdminPage() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'SUPER_ADMIN' as Role) {
    redirect('/unauthorized');
  }

  const [clinics, users] = await Promise.all([
    getClinics(),
    getClinicUsers()
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Administration Système</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ClinicManagement clinics={clinics} users={users} />
        
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Statistiques Globales</h2>
          {/* Statistiques globales */}
        </div>
      </div>
    </div>
  );
}