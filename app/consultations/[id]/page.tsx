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
  const notes = await getConsultationNotes(params.id) || {};

  // Trouver le traitement de consultation
  const consultationTreatment = consultation?.treatments?.find(t => t.type === "Consultation");
  
  // Calcul des montants
  const treatments = consultation?.treatments || [];
  const treatmentsCost = treatments.reduce((total, treatment) => total + (treatment.amount || 0), 0);
  const totalCost = treatmentsCost;
  
  // Calcul des paiements
  const treatmentsPaid = treatments.reduce((total, treatment) => total + (treatment.paidAmount || 0), 0);
  const totalPaid = treatmentsPaid;
  const remainingAmount = totalCost - totalPaid;
  
  // Statuts
  const globalStatus = remainingAmount <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';
  const status = totalPaid > 0 ? 'Partiel' : 'Non payé';

  // Données patient
  const patientName = consultation?.patientName || 'Patient inconnu';
  const patientAge = consultation?.patientAge;
  const patientPhone = consultation?.patientPhone || 'Non renseigné';
  const patientAddress = consultation?.patientAddress || 'Non renseignée';
  const consultationDate = consultation?.date ? new Date(consultation.date) : null;

  return (
    <Layout>
      {/* Conteneur principal avec scrolling horizontal */}
      <div className="w-full h-screen overflow-x-auto bg-background dark:bg-gray-950">
        {/* Contenu avec largeur minimale garantie */}
        <div className="min-w-[1024px] p-4 max-w-6xl mx-auto">
          
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="w-full">
              <Link href="/consultations" className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-3">
                <FiArrowLeft className="mr-2" />
                <span className="font-medium">Retour aux consultations</span>
              </Link>
              <Link 
                href={`/consultations/${consultation.id}/treatments/add`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border border-gray-200 dark:border-gray-800 px-4 py-2 text-sm rounded-lg transition-colors shadow-sm hover:shadow-md min-w-[200px]"
              >
                <FiPlus className="w-4 h-4" />
                <span>Ajouter traitement</span>
              </Link>
              <Link
                href={`/consultations/edit/${consultation.id}`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 text-sm rounded-lg transition-colors shadow-sm hover:shadow-md min-w-[200px]"
              >
                <FiEdit className="w-4 h-4" />
                <span>Modifier la consultation</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex flex-wrap items-center">
                <FiUser className="mr-3 text-blue-500 dark:text-blue-400" />
                {patientName}
                {patientAge && (
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-3">({patientAge} ans)</span>
                )}
              </h1>
            </div>
          </div>

          {/* Grille principale */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Colonne de gauche (1/3) */}
            <div className="space-y-6">
              {/* Carte Info Patient */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white flex items-center">
                  <FiUser className="mr-2 text-blue-500 dark:text-blue-400" />
                  Informations patient
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <FiPhone className="mt-0.5 mr-2 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                      <p className="font-medium dark:text-white">{patientPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiCalendar className="mt-0.5 mr-2 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                      <p className="font-medium dark:text-white">
                        {consultationDate ? consultationDate.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : 'Date non renseignée'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiMapPin className="mt-0.5 mr-2 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Adresse</p>
                      <p className="font-medium dark:text-white break-words">{patientAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte Paiement */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white flex items-center">
                  <FiDollarSign className="mr-2 text-green-500 dark:text-green-400" />
                  Statut de paiement
                </h2>
                <div className="space-y-3">
                  {consultationTreatment && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-2">
                      <div className="flex justify-between">
                        <span className="text-blue-800 dark:text-blue-200">Consultation:</span>
                        <span className="font-medium dark:text-white">
                          {consultationTreatment.amount?.toLocaleString() || '0'} FCFA
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

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
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

            {/* Colonne de droite (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section Traitements */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                    <FiPlus className="mr-2 text-blue-500 dark:text-blue-400" />
                    Traitements
                  </h2>
                  <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${
                    status === 'Partiel' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                  }`}>
                    {status}
                    
                  </span>
                </div>

                {treatments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {treatments.map(treatment => (
                          <tr key={treatment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 whitespace-nowrap font-medium dark:text-white">
                              {treatment.type}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 break-words max-w-[200px]">
                              {treatment.description || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
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
                                  {treatment.paidAmount?.toLocaleString() || '0'} / {treatment.amount?.toLocaleString() || '0'} FCFA
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right font-bold dark:text-white">
                              {treatment.amount?.toLocaleString() || '0'} FCFA
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

              {/* Section Notes */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                  <FiEdit className="mr-2 text-purple-500 dark:text-purple-400" />
                  Notes de consultation
                </h2>
                <div className="space-y-4">
                  <NoteEditor
                    consultationId={params.id}
                    noteType="assistant"
                    initialContent={notes?.assistantNote || ''}
                    editable={notes?.assistantNote !== null}
                    title="Note de l'assistant"
                    author={notes?.assistantName || 'Assistant'}
                    className="border border-gray-100 dark:border-gray-800 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-800/30"
                  />

                  {notes?.dentistNote !== null && notes?.dentistNote !== undefined && (
                    <NoteEditor
                      consultationId={params.id}
                      noteType="dentist"
                      initialContent={notes.dentistNote}
                      editable={notes.dentistNote !== null}
                      title="Note du dentiste"
                      author={notes.dentistName || 'Dentiste'}
                      className="border border-gray-100 dark:border-gray-800 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-800/30"
                    />
                  )}

                  {(!notes?.assistantNote && !notes?.dentistNote) && (
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

          {/* Boutons d'action */}
          {consultation?.id && (
            <div className="flex flex-wrap gap-3 mt-6">
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}