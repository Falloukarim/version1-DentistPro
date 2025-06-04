import { FiArrowLeft, FiPlus, FiDollarSign, FiEdit, FiUser, FiPhone, FiMapPin, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';
import { getConsultationById, getConsultationNotes } from '../action';
import NoteEditor from 'components/NoteEditor';
import Layout from 'components/layout';

export default async function ConsultationDetails({ 
  params 
}: { 
  params: { id: string }
}) {
  const consultation = await getConsultationById(params.id);
  const notes = await getConsultationNotes(params.id);

  // Trouver le traitement de consultation (s'il existe)
  const consultationTreatment = consultation.treatments?.find(t => t.type === "Consultation");
  
  // Calcul des montants
  const treatmentsCost = (consultation.treatments ?? []).reduce((total, treatment) => total + treatment.amount, 0);
  const totalCost = treatmentsCost; // On utilise uniquement les traitements
  
  // Calcul des paiements
  const treatmentsPaid = (consultation.treatments ?? []).reduce((total, treatment) => total + treatment.paidAmount, 0);
  const totalPaid = treatmentsPaid;
  const remainingAmount = totalCost - totalPaid;
  
  // Statuts
  const globalStatus = remainingAmount <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';
  const status = totalPaid > 0 ? 'Partiel' : 'Non payé';

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto bg-background dark:bg-gray-950 rounded-lg shadow-md dark:shadow-gray-800/50">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="w-full">
            <Link href="/consultations" className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-3 sm:mb-4">
              <FiArrowLeft className="mr-2" />
              <span className="font-medium text-sm sm:text-base">Retour aux consultations</span>
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex flex-wrap items-center">
              <FiUser className="mr-2 sm:mr-3 text-blue-500 dark:text-blue-400" />
              {consultation.patientName}
              {consultation.patientAge && (
                <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base ml-2 sm:ml-3">({consultation.patientAge} ans)</span>
              )}
            </h1>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Patient Info */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Patient Info Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-white flex items-center">
                <FiUser className="mr-2 text-blue-500 dark:text-blue-400" />
                Informations patient
              </h2>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start">
                  <FiPhone className="mt-1 mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                    <p className="font-medium dark:text-white">{consultation.patientPhone || 'Non renseigné'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FiCalendar className="mt-1 mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                    <p className="font-medium dark:text-white">{new Date(consultation.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) || 'Non renseignée'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FiMapPin className="mt-1 mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Adresse</p>
                    <p className="font-medium dark:text-white">{consultation.patientAddress || 'Non renseignée'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-white flex items-center">
            <FiDollarSign className="mr-2 text-green-500 dark:text-green-400" />
            Statut de paiement
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {consultationTreatment && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                <div className="flex justify-between">
                  <span className="text-blue-800 dark:text-blue-200">Consultation:</span>
                  <span className="font-medium dark:text-white">
                    {consultationTreatment.amount.toLocaleString()} FCFA
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-blue-700 dark:text-blue-300">Statut:</span>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${
                    consultationTreatment.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    consultationTreatment.status === 'PARTIAL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {consultationTreatment.status === 'PAID' ? 'Payé' : 
                     consultationTreatment.status === 'PARTIAL' ? 'Partiel' : 'Non payé'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Total:</span>
                <span className="font-semibold dark:text-white">{totalCost.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Payé:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{totalPaid.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Reste:</span>
                <span className={`font-bold ${
                  remainingAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {remainingAmount.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="font-medium dark:text-white">Statut global:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                globalStatus === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                globalStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
              }`}>
                {globalStatus === 'PAID' ? 'Payé' : 
                 globalStatus === 'PARTIAL' ? 'Partiel' : 'Non payé'}
              </span>
            </div>
          </div>
        </div>

          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Treatments Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                  <FiPlus className="mr-2 text-blue-500 dark:text-blue-400" />
                  Traitements
                </h2>
                <span className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium ${
                  status === 'Partiel' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                }`}>
                  {status}
                  {status === 'Partiel' && (
                    <span className="ml-1">({totalPaid.toLocaleString()} FCFA payés)</span>
                  )}
                </span>
              </div>

              {(consultation.treatments ?? []).length > 0 ? (
  <div className="space-y-4">
    {(consultation.treatments ?? []).map(treatment => (
      <div key={treatment.id} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium dark:text-white text-sm sm:text-base">{treatment.type}</h3>
            {treatment.description && (
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">{treatment.description}</p>
            )}
                          <div className="flex items-center mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              treatment.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              treatment.status === 'PARTIAL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                              {treatment.status === 'PAID' ? 'Payé' : 
                               treatment.status === 'PARTIAL' ? 'Partiel' : 'Non payé'}
                            </span>
                            {treatment.status === 'PARTIAL' && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                {treatment.paidAmount.toLocaleString()} FCFA / {treatment.amount.toLocaleString()} FCFA
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold dark:text-white text-sm sm:text-base">{treatment.amount.toLocaleString()} FCFA</span>
                      </div>
                      {treatment.status === 'PARTIAL' && (
                        <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 p-2 sm:p-3 rounded text-xs sm:text-sm">
                          <div className="flex justify-between items-center dark:text-white">
                            <span>Reste à payer:</span>
                            <span className="font-medium">{(treatment.amount - treatment.paidAmount).toLocaleString()} FCFA</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400 mb-3">Aucun traitement enregistré</p>
                  <Link 
                    href={`/consultations/${consultation.id}/treatments/add`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Ajouter un traitement</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Notes Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-white flex items-center">
                <FiEdit className="mr-2 text-purple-500 dark:text-purple-400" />
                Notes de consultation
              </h2>
              <div className="space-y-4 sm:space-y-5">
                <NoteEditor
                  consultationId={params.id}
                  noteType="assistant"
                  initialContent={notes.assistantNote}
                  editable={notes.assistantNote !== null}
                  title="Note de l'assistant"
                  author={notes.assistantName}
                  className="border border-gray-100 dark:border-gray-800 rounded-lg p-3 sm:p-4 bg-gray-50/50 dark:bg-gray-800/30"
                />

                {notes.dentistNote !== null && (
                  <NoteEditor
                    consultationId={params.id}
                    noteType="dentist"
                    initialContent={notes.dentistNote}
                    editable={notes.dentistNote !== null}
                    title="Note du dentiste"
                    author={notes.dentistName}
                    className="border border-gray-100 dark:border-gray-800 rounded-lg p-3 sm:p-4 bg-gray-50/50 dark:bg-gray-800/30"
                  />
                )}

                {(notes.assistantNote === null && notes.dentistNote === null) && (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-gray-400 mb-3">Aucune note enregistrée</p>
                    <Link
                      href={`/consultations/${consultation.id}/notes/add`}
                      className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span>Ajouter une note</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href={`/consultations/edit/${consultation.id}`}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 sm:px-5 py-2.5 text-sm sm:text-base rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            <FiEdit className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Modifier la consultation</span>
          </Link>
          
          <Link 
            href={`/consultations/${consultation.id}/treatments/add`}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border border-gray-200 dark:border-gray-800 px-4 py-2.5 text-sm sm:text-base rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Ajouter traitement</span>
          </Link>
          
        </div>

        {/* Payment Section */}
        {consultation.isPaid && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800/50">
            <div className="flex items-center gap-3">
              <FiCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-200">Consultation payée</h3>
                <p className="text-sm text-green-600 dark:text-green-300">Montant: 3,000 FCFA</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}