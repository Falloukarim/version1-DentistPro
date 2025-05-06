import { FiSave, FiX, FiDollarSign } from 'react-icons/fi';
import Link from 'next/link';
import { getConsultationById, updateConsultation } from '../../action';
import { addTreatmentPayment } from '../../../payments/action';

export default async function EditConsultation({ params }: { params: { id: string } }) {
  const consultation = await getConsultationById(params.id);
  
  // Formatage de la date pour l'input date
  const formattedDate = consultation.date instanceof Date 
    ? consultation.date.toISOString().split('T')[0]
    : new Date(consultation.date).toISOString().split('T')[0];

  // Calcul des montants pour les traitements seulement
  const treatmentsCost = consultation.treatments.reduce((total, treatment) => total + treatment.amount, 0);
  const treatmentsPaid = consultation.treatments.reduce((total, treatment) => total + treatment.paidAmount, 0);
  const remainingAmount = treatmentsCost - treatmentsPaid;

  return (
    <div className="h-full flex flex-col dark:bg-black">
      {/* Header fixe */}
      <div className="bg-background dark:bg-black border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Gestion des Paiements - Traitements
          </h2>
          <Link
            href={`/consultations/${consultation.id}`}
            className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm sm:text-base"
          >
            <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Retour</span>
          </Link>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto dark:bg-black">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
          {/* Section Paiement des Traitements */}
          <div className="bg-blue-50 dark:bg-gray-900 p-4 rounded-lg border border-blue-100 dark:border-gray-800 mb-6">
            <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
              <FiDollarSign className="w-5 h-5" /> Paiements des Traitements
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-background dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total traitements</p>
                <p className="font-bold text-lg dark:text-white">{treatmentsCost.toLocaleString()} FCFA</p>
              </div>
              <div className="bg-background dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Déjà payé</p>
                <p className="font-bold text-lg text-green-600 dark:text-green-400">{treatmentsPaid.toLocaleString()} FCFA</p>
              </div>
              <div className="bg-background dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Reste à payer</p>
                <p className="font-bold text-lg text-red-600 dark:text-red-400">{remainingAmount.toLocaleString()} FCFA</p>
              </div>
            </div>

            {remainingAmount > 0 && (
              <form 
                action={async (formData: FormData) => {
                  'use server';
                  const amount = Number(formData.get('paymentAmount'));
                  const treatmentId = formData.get('treatmentId') as string;
                  
                  if (amount > 0 && treatmentId) {
                    await addTreatmentPayment(treatmentId, {
                      amount,
                      paymentMethod: 'CASH',
                      paymentDate: new Date(),
                      reference: `PAY-${Date.now()}`,
                      notes: 'Paiement partiel traitement'
                    });
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Traitement
                    </label>
                    <select
                      name="treatmentId"
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                      required
                    >
                      <option value="">Sélectionner un traitement</option>
                      {consultation.treatments
                        .filter(t => t.amount > t.paidAmount)
                        .map(treatment => (
                          <option key={treatment.id} value={treatment.id}>
                            {treatment.type} - Reste: {(treatment.amount - treatment.paidAmount).toLocaleString()} FCFA
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Montant à payer
                    </label>
                    <input
                      type="number"
                      name="paymentAmount"
                      min="1"
                      max={remainingAmount}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 w-full sm:w-auto dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Enregistrer paiement
                </button>
              </form>
            )}

            {/* Liste des traitements */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Détails des traitements</h4>
              <div className="space-y-3">
                {consultation.treatments.map(treatment => (
                  <div key={treatment.id} className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium dark:text-white">{treatment.type}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {treatment.amount.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          treatment.status === 'PAID' ? 'text-green-600 dark:text-green-400' :
                          treatment.status === 'PARTIAL' ? 'text-blue-600 dark:text-blue-400' : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {treatment.status === 'PAID' ? 'Payé' : 
                           treatment.status === 'PARTIAL' ? 'Partiel' : 'Non payé'}
                        </p>
                        {treatment.status !== 'UNPAID' && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {treatment.paidAmount.toLocaleString()} FCFA payés
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Formulaire d'édition basique */}
          <form 
            action={async (formData: FormData) => {
              'use server';
              await updateConsultation(
                params.id,
                {
                  patientName: formData.get('patientName') as string,
                  patientPhone: formData.get('patientPhone') as string,
                  date: formData.get('date') as string,
                  description: formData.get('description') as string || null,
                }
              );
            }} 
            className="space-y-4"
          >
             
          </form>
        </div>
      </div>
    </div>
  );
}