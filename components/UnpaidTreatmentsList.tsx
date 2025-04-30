// components/UnpaidTreatmentsList.tsx
import { FiDollarSign, FiUser, FiPhone, FiCalendar } from 'react-icons/fi';
import Link from 'next/link';
import { getUnpaidTreatments } from 'app/dashboard/dashboard.actions';

export default async function UnpaidTreatmentsList() {
  const treatments = await getUnpaidTreatments();

  if (treatments.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm sm:text-base bg-background dark:bg-background rounded-lg">
        Tous les traitements sont payés
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-background dark:bg-background p-4 rounded-lg">
      {treatments.map(treatment => (
        <div key={treatment.id} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-sm sm:text-base text-foreground">
                {treatment.consultation.patientName}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{treatment.type}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-medium text-sm text-foreground">
                {(treatment.amount - treatment.paidAmount).toLocaleString()} FCFA
              </p>
              <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                treatment.status === 'PARTIAL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {treatment.status === 'PARTIAL' ? 'Partiel' : 'Non payé'}
              </span>
            </div>
          </div>
          <div className="flex items-center mt-3 gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <FiPhone className="mr-1" size={12} />
              <span>{treatment.consultation.patientPhone}</span>
            </div>
            <div className="flex items-center">
              <FiCalendar className="mr-1" size={12} />
              <span>
                {new Date(treatment.consultation.date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
          <Link
            href={`/consultations/edit/${treatment.consultationId}`}
            className="mt-3 inline-block text-xs bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800"
          >
            <FiDollarSign className="inline mr-1" size={12} />
            Payer maintenant
          </Link>
        </div>
      ))}
    </div>
  );
}
