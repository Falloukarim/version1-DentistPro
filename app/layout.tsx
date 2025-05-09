// app/layout.tsx
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from 'next/font/google';
import { NavigationProvider } from "components/ui/NavigationContext";
import ClientWrapper from "components/ClientWrapper";
import { Viewport } from "next";
import { ThemeProvider } from "components/ui/ThemeProvider";
import { ClinicThemeProvider } from "components/ClinicThemeProvider";
import { auth } from "@clerk/nextjs/server";
import { getClinicForUser } from "app/actions/clinic.actions";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "DENTISTE-PRO V1",
  description: "Application personnelle sécurisée",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const clinic = userId ? await getClinicForUser(userId) : null;

  return (
    <ClerkProvider>
      <html lang="fr" className={`${inter.className} h-full`} suppressHydrationWarning>
        <body className="h-full bg-background text-foreground">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ClinicThemeProvider clinic={clinic}>
              <NavigationProvider>
                <ClientWrapper>
                  {children}
                </ClientWrapper>
              </NavigationProvider>
            </ClinicThemeProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}