import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from 'next/font/google';
import { NavigationProvider } from "components/ui/NavigationContext";
import ClientWrapper from "components/ClientWrapper";
import { Viewport } from "next";
import { ThemeProvider } from "components/ui/ThemeProvider"; // Nouveau composant

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="fr" className={`${inter.className} h-full`} suppressHydrationWarning>
        <body className="h-full bg-background text-foreground">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <NavigationProvider>
              <ClientWrapper>
                {children}
              </ClientWrapper>
            </NavigationProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}