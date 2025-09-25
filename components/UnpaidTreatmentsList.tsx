// components/UnpaidTreatmentsList.tsx
import { FiDollarSign, FiPhone, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';
import { getUnpaidTreatments } from 'app/actions/dashboard.actions';
import { Treatment } from '@prisma/client';

// Type étendu pour inclure la relation consultation
type TreatmentWithConsultation = Treatment & {
  consultation: {
    patientName: string;
    patientPhone: string;
    date: Date;
    clinic?: {
      name: string;
    };
  };
};

export default async function UnpaidTreatmentsList() {
  let treatments: TreatmentWithConsultation[] = [];
  
  try {
    // Cast le retour de la fonction vers le bon type
    treatments = await getUnpaidTreatments() as TreatmentWithConsultation[];
    
    if (!treatments || treatments.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <FiAlertCircle className="inline-block mb-2" size={24} />
          <p className="text-sm">Tous les traitements sont payés</p>
        </div>
      );
    }
  } catch (error) {
    console.error('Error loading unpaid treatments:', error);
    return (
      <div className="text-center py-8 text-destructive bg-destructive/10 rounded-lg">
        <FiAlertCircle className="inline-block mb-2" size={24} />
        <p className="text-sm">Erreur lors du chargement des traitements</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {treatments.map((treatment) => (
        <div key={treatment.id} className="p-4 border border-border rounded-lg bg-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {treatment.consultation.patientName}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{treatment.type}</p>
              
              <div className="flex items-center mt-2 gap-4 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <FiPhone className="mr-1" size={12} />
                  <span>{treatment.consultation.patientPhone}</span>
                </div>
                <div className="flex items-center">
                  <FiCalendar className="mr-1" size={12} />
                  <span>
                    {treatment.consultation.date.toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right shrink-0">
              <p className="font-bold text-lg text-foreground">
                {(treatment.amount - treatment.paidAmount).toLocaleString('fr-FR')} FCFA
              </p>
              <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                treatment.status === 'PARTIAL' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {treatment.status === 'PARTIAL' ? 'Paiement partiel' : 'Non payé'}
              </span>
            </div>
          </div>
          
          <Link
            href={`/consultations/edit/${treatment.consultationId}`}
            className="mt-3 inline-flex items-center text-xs bg-primary/10 text-primary px-3 py-2 rounded-md hover:bg-primary/20 transition-colors"
          >
            <FiDollarSign className="mr-1" size={12} />
            Payer maintenant
          </Link>
        </div>
      ))}
    </div>
  );
}