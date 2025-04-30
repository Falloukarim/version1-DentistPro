import { FiArrowLeft, FiSave } from 'react-icons/fi';
import Link from 'next/link';
import { addTreatment, getConsultationById } from '../../../action';
import { Button } from '@/components/ui/button';

export default async function AddTreatment({ params }: { params: { id: string } }) {
  const consultation = await getConsultationById(params.id);

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

      <form action={async (formData) => {
        'use server';
        const type = formData.get('type') as string;
        const amount = parseFloat(formData.get('amount') as string);
        const paidAmount = parseFloat(formData.get('paidAmount') as string) || 0;
        const status = formData.get('status') as 'UNPAID' | 'PAID' | 'PARTIAL';
        
        await addTreatment(consultation.id, {
          type,
          amount,
          paidAmount,
          remainingAmount: amount - paidAmount,
          status
        });
      }} className="space-y-4">
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
              Annuler
            </Link>
          </Button>
          <Button type="submit" className="gap-2">
            <FiSave />
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}