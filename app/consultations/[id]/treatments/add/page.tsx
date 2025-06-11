'use client';
import { FiArrowLeft, FiSave, FiPrinter, FiX } from 'react-icons/fi';
import Link from 'next/link';
import { addTreatment, getConsultationById } from '../../../action';
import { Button } from '@/components/ui/button';
import { use, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="gap-2 transition-all duration-300 ease-in-out"
    >
      {pending ? (
        <>
          <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          Enregistrement...
        </>
      ) : (
        <>
          <FiSave />
          Enregistrer
        </>
      )}
    </Button>
  );
}

export default function AddTreatment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [consultation, setConsultation] = useState<any>(null);
  const [state, formAction] = useActionState(addTreatment, null);
  const [printUrl, setPrintUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const fetchConsultation = async () => {
      try {
        const data = await getConsultationById(id);
        setConsultation(data);
      } catch (error) {
        console.error('Failed to load consultation:', error);
      }
    };
    fetchConsultation();
  }, [id]);

  useEffect(() => {
    if (state?.success && state.id && isClient) {
      const currentUrl = `${window.location.protocol}//${window.location.host}/print/treatment/${state.id}`;
      setPrintUrl(`rawbt:${currentUrl}`);
    }
  }, [state, isClient]);

  if (!consultation) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-lg border animate-pulse">
        <div className="flex justify-center items-center h-40">
          <span className="inline-block h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (formData: FormData) => {
    formData.append('consultationId', consultation.id);
    return await formAction(formData);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md border space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/consultations/${consultation.id}`}>
            <FiArrowLeft size={20} />
          </Link>
        </Button>
        <h2 className="text-3xl font-semibold text-gray-800">Ajouter un Traitement</h2>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="font-semibold text-blue-900">
          👤 Patient : {consultation.patientName}
        </p>
        <p className="text-sm text-blue-800">
          🗓️ Consultation du : {new Date(consultation.date).toLocaleDateString()}
        </p>
      </div>

      <form action={handleSubmit} className="space-y-5">
        <input type="hidden" name="consultationId" value={consultation.id} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de traitement <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="type"
            required
            minLength={3}
            className="w-full px-4 py-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Ex: Détartrage, Extraction..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant total (FCFA) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              required
              min="0"
              step="500"
              className="w-full px-4 py-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant payé (FCFA)
            </label>
            <input
              type="number"
              name="paidAmount"
              min="0"
              step="500"
              className="w-full px-4 py-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="5000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut de paiement <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            required
            className="w-full px-4 py-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="UNPAID">Non payé</option>
            <option value="PAID">Payé</option>
            <option value="PARTIAL">Partiel</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button asChild variant="outline">
            <Link href={`/consultations/${consultation.id}`}>
              <FiX className="mr-2" />
              Annuler
            </Link>
          </Button>
          <SubmitButton />
        </div>
      </form>

      {state?.success && isClient && (
        <div className="mt-6 p-5 rounded-lg border border-green-300 bg-green-50 animate-fade-in">
          <p className="text-green-700 font-semibold mb-4">
            ✅ Traitement enregistré avec succès !
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={`/consultations/${consultation.id}`}>
                <FiX className="mr-2" />
                Retour à la consultation
              </Link>
            </Button>

            {printUrl && (
              <Button asChild>
                <a href={printUrl} target="_blank" rel="noopener noreferrer">
                  <FiPrinter className="mr-2" />
                  Imprimer le ticket
                </a>
              </Button>
            )}

            <Button asChild variant="secondary">
              <Link href={`/print/treatment/${state.id}`} target="_blank">
                <FiPrinter className="mr-2" />
                Voir le ticket
              </Link>
            </Button>
          </div>
        </div>
      )}

      {state?.error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
          <p className="font-medium">❌ Erreur : {state.error}</p>
        </div>
      )}
    </div>
  );
}
