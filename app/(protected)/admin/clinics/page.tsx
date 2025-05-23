// app/(protected)/admin/clinics/page.tsx
import { checkUserRole } from '@/lib/auth';
import ClinicsManager from './ClinicsManager';
import { redirect } from 'next/navigation';

export default async function ClinicsPage() {
  try {
    await checkUserRole(['SUPER_ADMIN']);
    return <ClinicsManager />;
  } catch (error) {
    console.error('Erreur de vérification du rôle:', error);
    redirect('/unauthorized'); // ou vers une page de connexion
  }
}