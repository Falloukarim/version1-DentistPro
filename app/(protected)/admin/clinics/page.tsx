// app/(protected)/admin/clinics/page.tsx
import { checkUserRole } from '@/lib/auth';
import ClinicsManager from './ClinicsManager';

export default async function ClinicsPage() {
  await checkUserRole(['SUPER_ADMIN']); // Gère automatiquement la redirection
  return <ClinicsManager />;
}