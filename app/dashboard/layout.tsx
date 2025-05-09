// app/dashboard/layout.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { syncUserAction } from '../../app/actions/sync-user';
import { ClinicThemeProvider } from 'components/ClinicThemeProvider';
import { getClinicForUser } from 'app/actions/clinic.actions';
import ClinicLogo from '../../components/ClinicLogo'; // Importez le composant ClinicLogo

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

  // Récupérer la clinique de l'utilisateur
  const clinic = await getClinicForUser(userId);

  // Synchronisation obligatoire de l'utilisateur
  try {
    const syncResult = await syncUserAction();
    if (!syncResult.success) {
      console.error('Échec de la synchronisation:', syncResult.message);
    }
  } catch (error) {
    console.error('Erreur critique de synchronisation:', error);
  }

  return (
    <ClinicThemeProvider clinic={clinic}>
      <section className="min-h-screen bg-gray-50">
        {/* Header avec couleurs dynamiques */}
        <header className="bg-primary text-primary-foreground shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <ClinicLogo 
              size={48} 
              className="border-2 border-primary-foreground"
            />
            <h1 className="text-xl font-semibold">
              {clinic?.name || 'Tableau de bord'}
            </h1>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-8">
          <Suspense fallback={<LoadingSpinner size="lg" className="my-8" />}>
            {children}
          </Suspense>
        </main>

        {/* Exemple de bouton avec couleurs dynamiques */}
        <div className="container mx-auto px-4 pb-8">
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded transition">
            Action principale
          </button>
        </div>
      </section>
    </ClinicThemeProvider>
  )
}