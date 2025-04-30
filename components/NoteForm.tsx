'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateConsultationNote } from 'app/consultations/action';

export default function NoteForm({
  consultationId,
  userRole,
}: {
  consultationId: string;
  userRole: 'ASSISTANT' | 'DENTIST' | 'ADMIN';
}) {
  const [noteType, setNoteType] = useState<'assistant' | 'dentist'>(
    userRole === 'DENTIST' ? 'dentist' : 'assistant'
  );
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateConsultationNote(consultationId, noteType, content);
      router.push(`/consultations/${consultationId}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {userRole === 'ADMIN' && (
        <div className="space-y-2">
          <label className="block font-medium">Type de note</label>
          <select
            value={noteType}
            onChange={(e) => setNoteType(e.target.value as 'assistant' | 'dentist')}
            className="w-full p-2 border rounded"
          >
            <option value="assistant">Note Assistant</option>
            <option value="dentist">Note Dentiste</option>
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label className="block font-medium">Contenu de la note</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded min-h-[200px]"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push(`/consultations/${consultationId}`)}
          className="px-4 py-2 border rounded"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}