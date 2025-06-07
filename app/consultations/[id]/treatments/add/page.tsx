'use client';
import { FiArrowLeft, FiSave, FiPrinter, FiX } from 'react-icons/fi';
import Link from 'next/link';
import { addTreatment, getConsultationById } from '../../../action';
import { Button } from '@/components/ui/button';
import { use, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending} className="gap-2">
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
  // Unwrap the params promise properly
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
        const data = await getConsultationById(id); // Use the unwrapped id
        setConsultation(data);
      } catch (error) {
        console.error('Failed to load consultation:', error);
      }
    };
    fetchConsultation();
  }, [id]); // Dependency on the unwrapped id

  useEffect(() => {
    if (state?.success && state.id && isClient) {
      const currentUrl = `${window.location.protocol}//${window.location.host}/print/treatment/${state.id}`;
      setPrintUrl(`rawbt:${currentUrl}`);
    }
  }, [state, isClient]);

  if (!consultation) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-card rounded-lg shadow-md border">
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
    <div className="p-6 max-w-lg mx-auto bg-card rounded-lg shadow-md border">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/consultations/${consultation.id}`}>
            <FiArrowLeft size={20} />
          </Link>
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Ajouter un Traitement</h2>
      </div>
      
      <div className="mb-4 p-4 bg-accent rounded border">
        <p className="font-semibold text-foreground">Patient: {consultation.patientName}</p>
        <p className="text-sm text-muted-foreground">Consultation du: {new Date(consultation.date).toLocaleDateString()}</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="consultationId" value={consultation.id} />
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Type de traitement <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            name="type"
            required
            minLength={3}
            className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Montant total (FCFA) <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            name="amount"
            required
            min="0"
            step="500"
            className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Montant payé (FCFA)
          </label>
          <input
            type="number"
            name="paidAmount"
            min="0"
            step="500"
            className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Statut de paiement <span className="text-destructive">*</span>
          </label>
          <select
            name="status"
            required
            className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
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
        <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/20">
          <p className="text-success mb-4">Traitement enregistré avec succès!</p>
          
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={`/consultations/${consultation.id}`}>
                <FiX className="mr-2" />
                Retour à la consultation
              </Link>
            </Button>

            {printUrl && (
              <Button asChild>
                <a
                  href={printUrl}
                  className="flex items-center gap-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
        <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          <p className="font-medium">Erreur : {state.error}</p>
        </div>
      )}
    </div>
  );
}