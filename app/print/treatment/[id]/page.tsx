import { getTreatmentById } from 'app/consultations/action';
import { notFound } from 'next/navigation';
import { formatDate, formatCurrency } from '@/lib/utils';
import PrintLayout from 'components/print-layout';
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from 'react';

export default async function PrintTreatmentPage({
  params,
}: {
  params: { id: string };
}) {
  const treatment = await getTreatmentById(params.id);
  if (!treatment) return notFound();

  return (
    <PrintLayout title={`Traitement - ${treatment.type}`}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{treatment.type}</h1>
            <p className="text-sm text-muted-foreground">
              {treatment.consultation.patientName} - {treatment.consultation.patientPhone}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm">Date: {formatDate(treatment.createdAt)}</p>
            <p className="text-sm">Ref: {treatment.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Détails du traitement</h3>
            <p>Type: {treatment.type}</p>
            <p>Statut: {treatment.status}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Informations financières</h3>
            <p>Montant total: {formatCurrency(treatment.amount)}</p>
            <p>Montant payé: {formatCurrency(treatment.paidAmount)}</p>
            <p>Reste à payer: {formatCurrency(treatment.remainingAmount)}</p>
          </div>
        </div>

        {treatment.payments.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Historique des paiements</h3>
            <div className="border rounded-md divide-y">
              {treatment.payments.map((payment: { id: Key | null | undefined; amount: number; paymentMethod: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; paymentDate: string | Date; }) => (
                <div key={payment.id} className="p-3 grid grid-cols-3">
                  <div>{formatCurrency(payment.amount)}</div>
                  <div>{payment.paymentMethod}</div>
                  <div className="text-right">{formatDate(payment.paymentDate)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
          <p>Clinique: {treatment.clinic.name}</p>
          <p>Date d'impression: {formatDate(new Date())}</p>
        </div>
      </div>
    </PrintLayout>
  );
}