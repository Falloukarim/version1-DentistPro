// app/dashboard/layout.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { syncUserAction } from "../../app/actions/sync-user";
import { ClinicThemeProvider } from "components/ClinicThemeProvider";
import ClinicLogo from "../../components/ClinicLogo";

export const metadata = {
  title: "Tableau de bord - Moi",
  description: "Votre espace personnel sécurisé",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const clerkUser = await currentUser();

  let clinic = null;

  if (!clerkUser) {
    console.warn("Clerk user non trouvé");
    redirect("/sign-in"); // Ou autre gestion, selon besoin
  } else {
    const syncResult = await syncUserAction(userId!, clerkUser);
    if (!syncResult.success) {
      console.error("Échec de la synchronisation:", syncResult.message);
    }
    clinic = syncResult.user?.clinic ?? null;
  }

  return (
    <ClinicThemeProvider clinic={clinic}>
      <section className="min-h-screen bg-background">
        {/* Header avec couleurs dynamiques */}
        <header className="bg-primary text-primary-foreground shadow-sm">
          <div className="px-4 py-4 flex items-center gap-4">
            <ClinicLogo size={48} className="border-2 border-primary-foreground" />
            <h1 className="text-xl font-semibold">{clinic?.name || "Tableau de bord"}</h1>
          </div>
        </header>

        {/* Main content - full width */}
        <main className="w-full">
          <Suspense fallback={<LoadingSpinner size="lg" className="my-8" />}>
            {children}
          </Suspense>
        </main>
      </section>
    </ClinicThemeProvider>
  );
}
