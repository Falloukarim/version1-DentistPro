// app/(protected)/layout.tsx
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import Navbar from 'components/Navbar';
import { redirect } from 'next/navigation';
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  const user = userId ? await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true },
  }) : null;

  if (!user) redirect('/sign-in');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        onLogout={() => {
          // Votre logique de déconnexion
        }}
        userRole={user.role}
        userId={user.id} // Passez d'autres props si nécessaire
      />
      
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
      
      {/* Footer optionnel */}
    </div>
  );
}