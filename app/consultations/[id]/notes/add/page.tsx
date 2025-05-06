import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma'
import NoteForm from 'components/NoteForm';

export default async function AddNotePage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, role: true },
  });

  if (!user) redirect('/sign-in');

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Ajouter une note</h1>
      <NoteForm 
        consultationId={params.id} 
        userRole={user.role} 
      />
    </div>
  );
}