import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { syncUserAction } from "../../app/actions/sync-user";
import { ClinicThemeProvider } from "components/ClinicThemeProvider";
import ClinicLogo from "../../components/ClinicLogo";
import Layout from "../../components/layout";

export const metadata = {
  title: "Tableau de bord",
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
    redirect("/sign-in");
  } else {
    const syncResult = await syncUserAction(userId!, clerkUser);
    if (!syncResult.success) {
      console.error("Échec de la synchronisation:", syncResult.message);
    }
    clinic = syncResult.user?.clinic ?? null;
  }

  return (
    <ClinicThemeProvider clinic={clinic}>
      <Layout>
        <div className="flex flex-col h-full">
          {/* Header intégré dans le Layout */}
          <main className="flex-1 overflow-y-auto">
            <Suspense fallback={<LoadingSpinner size="lg" className="my-8" />}>
              {children}
            </Suspense>
          </main>
        </div>
      </Layout>
    </ClinicThemeProvider>
  );
}