'use client';

import { useRouter } from 'next/navigation';
import { deleteAppointment } from '../action';
import { FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      setIsDeleting(true);
      try {
        await deleteAppointment(id);
        router.push('/appointments');
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-md text-sm transition-colors disabled:opacity-70"
    >
      <FiTrash2 size={14} />
      <span>{isDeleting ? 'Suppression...' : 'Supprimer'}</span>
    </button>
  );
}