import { FiArrowLeft, FiDollarSign } from 'react-icons/fi';
import Link from 'next/link';
import { getTreatmentById, addPayment } from '../../../../action';
import { Button } from '@/components/ui/button';
export default async function AddPaymentPage({
  params
}: {
  params: { id: string; treatmentId: string }
}) {
  const treatment = await getTreatmentById(params.treatmentId);

  return (
    <div className="p-6 max-w-lg mx-auto bg-card rounded-lg shadow-md border">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/consultations/${params.id}`}>
            <FiArrowLeft size={20} />
          </Link>
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Ajouter un Paiement</h2>
      </div>
       
      <div className="mb-4 p-4 bg-accent rounded border">
        <p className="font-semibold text-foreground">Traitement: {treatment.type}</p>
        <p className="text-sm text-muted-foreground">
          Reste à payer: {(treatment.amount - treatment.paidAmount).toLocaleString()} FCFA
        </p>
      </div>

      <form action={async (formData) => {
        'use server';
        const amount = parseFloat(formData.get('amount') as string);
        await addPayment(params.treatmentId, amount);
      }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Montant (FCFA) <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            name="amount"
            required
            min="0"
            max={treatment.amount - treatment.paidAmount}
            step="100"
            className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button asChild variant="outline">
            <Link href="/consultations">
              Annuler
            </Link>
          </Button>
          <Button type="submit" className="gap-2">
            <FiDollarSign />
            Enregistrer Paiement
          </Button>
        </div>
      </form>
    </div>
  );
}