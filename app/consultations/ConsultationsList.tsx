'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  FiArrowLeft, 
  FiPlusCircle, 
  FiEye, 
  FiPlus, 
  FiTrash2, 
  FiEdit,
  FiSave,
  FiX,
  FiUser,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiDollarSign,
  FiSearch
} from 'react-icons/fi';
import { deleteAllConsultations, updateConsultation } from './action';
import type { Consultation } from './action';

interface ConsultationsListProps {
  consultations: Consultation[];
}

export default function ConsultationsList({ consultations: initialConsultations }: ConsultationsListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user: clerkUser, isLoaded } = useUser();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editForm, setEditForm] = useState({
    patientName: '',
    patientPhone: '',
    patientAddress: '',
    date: '',
    description: '',
    isPaid: false
  });

  // Filtrer les consultations basée sur le terme de recherche
  const filteredConsultations = useMemo(() => {
    if (!searchTerm) return initialConsultations;
    return initialConsultations.filter(consultation => 
      consultation.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [initialConsultations, searchTerm]);

  const getTotalCost = (consultation: Consultation) => {
    const consultationCost = consultation.isPaid ? 3000 : 0;
    const treatmentsCost = consultation.treatments.reduce(
      (total, treatment) => total + treatment.amount, 0
    );
    return consultationCost + treatmentsCost;
  };
  
  const getPaidAmount = (consultation: Consultation) => {
    const consultationPaid = consultation.isPaid ? 3000 : 0;
    const treatmentsPaid = consultation.treatments.reduce(
      (total, treatment) => total + treatment.paidAmount, 0
    );
    return consultationPaid + treatmentsPaid;
  };

  const getGlobalStatus = (consultation: Consultation) => {
    const totalPaid = getPaidAmount(consultation);
    const totalCost = getTotalCost(consultation);
    
    if (totalCost === 0) return 'PAID';
    if (totalPaid >= totalCost) return 'PAID';
    if (totalPaid > 0) return 'PARTIAL';
    return 'UNPAID';
  };

  const startEditing = (consultation: Consultation) => {
    setEditingId(consultation.id);
    setEditForm({
      patientName: consultation.patientName,
      patientPhone: consultation.patientPhone,
      patientAddress: consultation.patientAddress || '',
      date: consultation.date.toISOString().split('T')[0],
      description: consultation.description || '',
      isPaid: consultation.isPaid
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      await updateConsultation(editingId, {
        patientName: editForm.patientName,
        patientPhone: editForm.patientPhone,
        patientAddress: editForm.patientAddress || null,
        date: editForm.date,
        description: editForm.description || null,
        isPaid: editForm.isPaid
      });
      
      setEditingId(null);
      router.refresh();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleDeleteAll = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer toutes les consultations et leurs traitements associés ?")) {
      try {
        await deleteAllConsultations();
        router.refresh();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Une erreur est survenue lors de la suppression");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Consultations</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            <FiArrowLeft className="text-lg" />
            <span>Tableau de bord</span>
          </Link>
          <button
            onClick={handleDeleteAll}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            <FiTrash2 className="text-lg" />
            <span>Supprimer tout</span>
          </button>
          <Link
            href="/consultations/add"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            <FiPlusCircle className="text-lg" />
            <span>Nouvelle Consultation</span>
          </Link>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom de patient..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FiX />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredConsultations.length} résultat(s) trouvé(s) pour "{searchTerm}"
          </p>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Téléphone</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Adresse</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Coût Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredConsultations.map(consultation => {
                const isEditing = editingId === consultation.id;
                const totalCost = getTotalCost(consultation);
                const paidAmount = getPaidAmount(consultation);
                const globalStatus = getGlobalStatus(consultation);
                
                return (
                  <tr key={consultation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {isEditing ? (
                      <td className="px-6 py-4" colSpan={7}>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <FiUser className="inline mr-2" /> Nom patient
                              </label>
                              <input
                                type="text"
                                name="patientName"
                                value={editForm.patientName}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <FiPhone className="inline mr-2" /> Téléphone
                              </label>
                              <input
                                type="text"
                                name="patientPhone"
                                value={editForm.patientPhone}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <FiCalendar className="inline mr-2" /> Date
                              </label>
                              <input
                                type="date"
                                name="date"
                                value={editForm.date}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <FiMapPin className="inline mr-2" /> Adresse
                              </label>
                              <input
                                type="text"
                                name="patientAddress"
                                value={editForm.patientAddress}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Description
                            </label>
                            <textarea
                              name="description"
                              value={editForm.description}
                              onChange={handleEditChange}
                              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white"
                              rows={2}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="flex items-center gap-1 px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <FiX /> Annuler
                            </button>
                            <button
                              type="submit"
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800"
                            >
                              <FiSave /> Enregistrer
                            </button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {consultation.patientName}
                          {consultation.patientAge && (
                            <span className="text-gray-500 dark:text-gray-400 ml-2">({consultation.patientAge} ans)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {consultation.patientPhone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {consultation.date.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {consultation.patientAddress || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {totalCost.toLocaleString()} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              globalStatus === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              globalStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                              {globalStatus === 'PAID' ? 'Payé' : 
                               globalStatus === 'PARTIAL' ? 'Partiel' : 'Non payé'}
                            </span>
                            {globalStatus === 'PARTIAL' && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Payé: {paidAmount.toLocaleString()} FCFA / {totalCost.toLocaleString()} FCFA
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEditing(consultation)}
                              className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-md text-xs transition-colors"
                            >
                              <FiEdit size={14} />
                              <span>Modifier</span>
                            </button>
                            <Link
                              href={`/consultations/${consultation.id}`}
                              className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-md text-xs transition-colors"
                            >
                              <FiEye size={14} />
                              <span>Détails</span>
                            </Link>
                            <Link 
                              href={`/consultations/${consultation.id}/treatments/add`}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md"
                            >
                              <FiPlus size={14} />
                              <span>Traitement</span>
                            </Link>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredConsultations.length === 0 && (
        <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
          {searchTerm ? 
            `Aucune consultation trouvée pour "${searchTerm}"` : 
            'Aucune consultation enregistrée'}
        </div>
      )}
    </div>
  );
}