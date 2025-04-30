// app/dashboard/layout.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { syncUserAction } from '../../app/actions/sync-user';

export const metadata = {
  title: "Tableau de bord - Moi",
  description: "Votre espace personnel sécurisé",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Vérification d'authentification
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Synchronisation obligatoire de l'utilisateur
  try {
    const syncResult = await syncUserAction();
    if (!syncResult.success) {
      console.error('Échec de la synchronisation:', syncResult.message);
      // Rediriger vers une page d'erreur ou forcer une déconnexion
      redirect('/auth/sync-error');
    }
  } catch (error) {
    console.error('Erreur critique de synchronisation:', error);
    redirect('/auth/sync-error');
  }

  return (
    <section className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSpinner size="lg" className="my-8" />}>
          {children}
        </Suspense>
      </main>
    </section>
  );
}