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
    select: { role: true, id: true },
  }) : null;

  if (!user) redirect('/sign-in');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        userRole={user.role}
        userId={user.id}
      />
      
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}