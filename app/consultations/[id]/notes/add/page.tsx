import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import NoteForm from 'components/NoteForm';
import { FiFileText, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default async function AddNotePage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, role: true, firstName: true, lastName: true },
  });

  if (!user) redirect('/sign-in');

  // Vérifier le rôle autorisé avant de rendre la page
  const allowedRoles = ['ADMIN', 'DENTIST', 'ASSISTANT'];
  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized'); // Ou la page que tu veux pour accès refusé
  }

  // Get consultation details for the header
  const consultation = await prisma.consultation.findUnique({
    where: { id: params.id },
    select: { patientName: true, date: true },
  });

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      {/* Header with back button */}
      <div className="mb-6 sm:mb-8">
        <Link 
          href={`/consultations/${params.id}`} 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-4"
        >
          <FiArrowLeft className="mr-2" />
          <span className="text-sm font-medium">Retour à la consultation</span>
        </Link>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
            <FiFileText className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Ajouter une note
            </h1>
            {consultation && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Pour {consultation.patientName} - {new Date(consultation.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Note Form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Rédigez votre note
          </h2>
          <NoteForm 
            consultationId={params.id} 
            userRole={user.role as 'ADMIN' | 'DENTIST' | 'ASSISTANT'}
            userName={`${user.firstName} ${user.lastName}`}
          />
        </div>
      </div>

      {/* Footer note */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
        Les notes ajoutées seront visibles uniquement par vous
      </p>
    </div>
  );
}
