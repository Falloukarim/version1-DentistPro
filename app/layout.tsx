// app/layout.tsx
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Inter } from "next/font/google";
import { NavigationProvider } from "components/ui/NavigationContext";
import ClientWrapper from "components/ClientWrapper";
import { Viewport } from "next";
import { ThemeProvider } from "components/ui/ThemeProvider";
import { ClinicThemeProvider } from "components/ClinicThemeProvider";
import { auth } from "@clerk/nextjs/server";
import { getClinicForUser } from "app/actions/clinic.actions";
import OnlineCheckLayout from "./online-check/layout";
import { Toaster } from "@/components/ui/sonner";
import { syncUserAction } from "./actions/sync-user";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DENTISTE-PRO V1",
  description: "Application personnelle sécurisée",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  let clinic = null;

  if (!userId || !clerkUser) {
    console.warn("Utilisateur non connecté ou Clerk introuvable");
  } else {
    const result = await syncUserAction(userId, clerkUser);
    if (!result.success) {
      console.error("Échec de la synchronisation:", result.message);
    }
    clinic = result.user?.clinic ?? null;
  }

  return (
    <OnlineCheckLayout>
      <ClerkProvider
        appearance={{
          variables: {
            colorPrimary: "#3b82f6",
          },
        }}
      >
        <html lang="fr" className={`${inter.className} h-full`} suppressHydrationWarning>
          <body className="h-full bg-background text-foreground">
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <ClinicThemeProvider clinic={clinic}>
                <NavigationProvider>
                  <ClientWrapper clinic={clinic}>
                    {children}
                    <Toaster position="top-right" richColors closeButton />
                  </ClientWrapper>
                </NavigationProvider>
              </ClinicThemeProvider>
            </ThemeProvider>
          </body>
        </html>
      </ClerkProvider>
    </OnlineCheckLayout>
  );
}
