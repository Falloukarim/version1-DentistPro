import { FiArrowLeft, FiPlus, FiDollarSign, FiEdit, FiUser, FiPhone, FiMapPin, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';
import { getConsultationById, getConsultationNotes } from '../action';
import NoteEditor from 'components/NoteEditor';
import Layout from 'components/layout';

export default async function ConsultationDetails({ params }: { params: { id: string } }) {
  const consultation = await getConsultationById(params.id);
  const notes = await getConsultationNotes(params.id);

  // Calcul des montants
  const consultationCost = 3000; // Montant fixe pour la consultation
  const treatmentsCost = consultation.treatments.reduce((total, treatment) => total + treatment.amount, 0);
  const totalCost = consultationCost + treatmentsCost;
  
  // Calcul des paiements
  const consultationPaid = consultation.isPaid ? 3000 : 0;
  const treatmentsPaid = consultation.treatments.reduce((total, treatment) => total + treatment.paidAmount, 0);
  const totalPaid = consultationPaid + treatmentsPaid;
  const remainingAmount = totalCost - totalPaid;
  
  // Statuts
  const globalStatus = remainingAmount <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';
  const status = totalPaid > 0 ? 'Partiel' : 'Non payé';

  return (
    <Layout>
    <div className="p-4 sm:p-6 max-w-4xl mx-auto bg-background rounded-lg shadow-md">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div className="w-full">
          <Link href="/consultations" className="flex items-center text-blue-600 hover:text-blue-800 mb-3 sm:mb-4">
            <FiArrowLeft className="mr-2" />
            <span className="font-medium text-sm sm:text-base">Retour aux consultations</span>
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex flex-wrap items-center">
            <FiUser className="mr-2 sm:mr-3 text-blue-500" />
            {consultation.patientName}
            {consultation.patientAge && (
              <span className="text-gray-500 text-sm sm:text-base ml-2 sm:ml-3">({consultation.patientAge} ans)</span>
            )}
          </h1>
        </div>
      </div>

        {/* Main Grid Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Patient Info */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <div className="bg-background border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 flex items-center">
                <FiUser className="mr-2 text-blue-500" />
                Informations patient
              </h2>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start">
                  <FiPhone className="mt-1 mr-3 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">{consultation.patientPhone || 'Non renseigné'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FiCalendar className="mt-1 mr-3 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{new Date(consultation.date).toLocaleDateString() || 'Non renseignée'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FiMapPin className="mt-1 mr-3 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="font-medium">{consultation.patientAddress || 'Non renseignée'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-background border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Statut de paiement</h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Total:</span>
                    <span>{totalCost.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Payé:</span>
                    <span>{totalPaid.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Reste:</span>
                    <span>{remainingAmount.toLocaleString()} FCFA</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Statut:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    globalStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                    globalStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
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
            {/* Treatments Section */}
            <div className="bg-background border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Traitements</h2>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                  status === 'Partiel' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {status}
                  {status === 'Partiel' && (
                    <span className="ml-1">({totalPaid.toLocaleString()} FCFA payés)</span>
                  )}
                </span>
              </div>

              {consultation.treatments.length > 0 ? (
                <div className="space-y-4">
                  {consultation.treatments.map(treatment => (
                    <div key={treatment.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{treatment.type}</h3>
                          <div className="flex items-center mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              treatment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                              treatment.status === 'PARTIAL' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {treatment.status === 'PAID' ? 'Payé' : 
                               treatment.status === 'PARTIAL' ? 'Partiel' : 'Non payé'}
                            </span>
                            {treatment.status === 'PARTIAL' && (
                              <span className="ml-2 text-xs text-gray-500">
                                {treatment.paidAmount.toLocaleString()} FCFA / {treatment.amount.toLocaleString()} FCFA
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold">{treatment.amount.toLocaleString()} FCFA</span>
                      </div>
                      {treatment.status === 'PARTIAL' && (
                        <div className="mt-2 bg-gray-50 p-2 rounded text-sm">
                          <div className="flex justify-between">
                            <span>Reste à payer:</span>
                            <span>{(treatment.amount - treatment.paidAmount).toLocaleString()} FCFA</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun traitement enregistré</p>
              )}
            </div>

            {/* Notes Section */}
            <div className="bg-background border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Notes</h2>
              <div className="space-y-3 sm:space-y-4">
                <NoteEditor
                  consultationId={params.id}
                  noteType="assistant"
                  initialContent={notes.assistantNote}
                  editable={notes.assistantNote !== null}
                  title="Note de l'assistant"
                  author={notes.assistantName}
                />

                {notes.dentistNote !== null && (
                  <NoteEditor
                    consultationId={params.id}
                    noteType="dentist"
                    initialContent={notes.dentistNote}
                    editable={notes.dentistNote !== null}
                    title="Note du dentiste"
                    author={notes.dentistName}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {/* Action Buttons - Adapté pour mobile */}
<div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
  <Link
    href={`/consultations/edit/${consultation.id}`}
    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors"
  >
    <FiEdit className="w-4 h-4 sm:w-5 sm:h-5" />
    <span>Modifier</span>
  </Link>
  <Link 
    href={`/consultations/${consultation.id}/treatments/add`}
    className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800 text-xs sm:text-sm px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-md"
  >
    <FiPlus className="w-3 h-3 sm:w-4 sm:h-4" />
    <span>Traitement</span>
  </Link>
  <Link
    href={`/consultations/${consultation.id}/notes/add`}
    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors"
  >
    <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
    <span>Note</span>
  </Link>
</div>

        {/* Payment Section */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-background rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-800 mb-2 sm:mb-3">Paiement Consultation</h3>
          <div className="flex items-center gap-2 text-green-600 text-sm sm:text-base">
            <FiCheckCircle className="text-sm sm:text-lg" />
            <span>Consultation payée (3000 FCFA)</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}