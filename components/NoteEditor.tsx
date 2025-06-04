'use client';

import { useState } from 'react';
import { FiSave, FiX, FiEdit, FiLock } from 'react-icons/fi';
import { updateConsultationNote } from '../app/consultations/action';
import { useRouter } from 'next/navigation';

type NoteEditorProps = {
  consultationId: string;
  noteType: 'dentist' | 'assistant';
  initialContent?: string | null;
  editable: boolean;
  title: string;
  author?: string;
  className?: string;  

};

export default function NoteEditor({
  consultationId,
  noteType,
  initialContent = '',
  editable,
  title,
  author
}: NoteEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateConsultationNote(consultationId, noteType, content);
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-background p-4 rounded-lg shadow border border-gray-200 mb-4">
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md min-h-[150px]"
            placeholder={`Écrivez votre note ${noteType === 'dentist' ? 'pour le dentiste' : "pour l'assistant"} ici...`}
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setContent(initialContent || '');
              }}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              <FiX /> Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isSubmitting || !content.trim()}
            >
              <FiSave /> {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-background p-4 rounded-lg shadow border border-gray-200 mb-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        {editable ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <FiEdit size={16} /> Modifier
          </button>
        ) : (
          <span className="text-gray-500 flex items-center gap-1">
            <FiLock size={14} /> Privé
          </span>
        )}
      </div>

      {/* Ajout du bloc conditionnel */}
      {!initialContent && !isEditing ? (
        <div className="text-gray-500 italic">
          Aucune note {noteType === 'dentist' ? 'du dentiste' : "de l'assistant"}
          {editable && (
            <button 
              onClick={() => setIsEditing(true)}
              className="ml-2 text-blue-500 hover:text-blue-700"
            >
              (Ajouter)
            </button>
          )}
        </div>
      ) : (
        content ? (
          <div className="whitespace-pre-line bg-gray-50 p-3 rounded">
            {content}
          </div>
        ) : (
          <p className="text-gray-500 italic bg-gray-50 p-3 rounded">
            Aucune note disponible
          </p>
        )
      )}

      {author && (
        <p className="text-sm text-gray-500 mt-2">
          Rédigée par: {author}
        </p>
      )}
    </div>
  );
}
