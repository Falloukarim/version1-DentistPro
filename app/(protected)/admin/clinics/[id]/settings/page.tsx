import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ClinicSettingsForm from 'components/ClinicSettingsForm';

export default async function ClinicSettingsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // On attend explicitement les params
  const resolvedParams = await params;
  const clinicId = resolvedParams.id;

  // Authentification Clerk
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Récupération de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true, clinicId: true },
  });

  if (!user || (user.role !== 'SUPER_ADMIN' && user.clinicId !== clinicId)) {
    redirect('/unauthorized');
  }

  // Récupération de la clinique
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      address: true,
      phone: true,
      email: true,
    },
  });

  if (!clinic) {
    redirect('/admin/clinics');
  }

  // Affichage du formulaire
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Paramètres de {clinic.name}</h1>
      <ClinicSettingsForm clinic={clinic} />
    </div>
  );
}