'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  FiSearch,
  FiDollarSign
} from 'react-icons/fi';
import { deleteAllConsultations, updateConsultation } from './action';
import type { Consultation } from './action';

// Palette de couleurs moderne
const colors = {
  primary: '#4F46E5', // Violet indigo
  secondary: '#10B981', // Vert émeraude
  accent: '#6366F1', // Violet doux
  danger: '#EF4444', // Rouge
  background: '#F9FAFB', // Gris très clair
  text: '#111827', // Gris foncé
  lightText: '#6B7280', // Gris moyen
  border: '#E5E7EB', // Gris clair
  white: '#FFFFFF'
};

interface ConsultationsListProps {
  consultations: Consultation[];
}

export default function ConsultationsList({ consultations: initialConsultations }: ConsultationsListProps) {
  const router = useRouter();
  const [loading] = useState(false);
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
    return (consultation.treatments || []).reduce(
      (total, treatment) => total + treatment.amount, 
      0
    );
  };
  
  const getPaidAmount = (consultation: Consultation) => {
    const consultationPaid = consultation.isPaid ? 3000 : 0;
    const treatmentsPaid = (consultation.treatments || []).reduce(
      (total, treatment) => total + treatment.paidAmount, 
      0
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text }}>
                Gestion des Consultations
              </h2>
              <p className="text-sm" style={{ color: colors.lightText }}>
                {initialConsultations.length} consultation(s) enregistrée(s)
              </p>
            </div>
            
            {/* Barre de recherche */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un patient..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                style={{ borderColor: colors.border }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
          
          {searchTerm && (
            <p className="text-sm" style={{ color: colors.lightText }}>
              {`${filteredConsultations.length} résultat(s) trouvé(s) pour "${searchTerm}"`}
            </p>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg transition-all shadow-sm"
            style={{ borderColor: colors.border }}
          >
            <FiArrowLeft className="text-lg" />
            <span>Retour</span>
          </Link>
          
          <button
            onClick={handleDeleteAll}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            <FiTrash2 className="text-lg" />
            <span>Vider la liste</span>
          </button>
          
          <Link
            href="/consultations/add"
            className="flex items-center justify-center gap-2 bg-primary hover:bg-accent text-white px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            <FiPlusCircle className="text-lg" />
            <span>Nouvelle Consultation</span>
          </Link>
        </div>

        {/* Liste des consultations */}
        <div className="space-y-4">
          {filteredConsultations.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-dashed" style={{ borderColor: colors.border }}>
              <p className="text-gray-500">
                {searchTerm ? 
                  `Aucune consultation trouvée pour "${searchTerm}"` : 
                  'Aucune consultation enregistrée'}
              </p>
              <Link 
                href="/consultations/add" 
                className="mt-4 inline-flex items-center gap-2 text-primary hover:text-accent font-medium"
              >
                <FiPlusCircle /> Créer une consultation
              </Link>
            </div>
          ) : (
            filteredConsultations.map(consultation => {
              const isEditing = editingId === consultation.id;
              const totalCost = getTotalCost(consultation);
              const paidAmount = getPaidAmount(consultation);
              const globalStatus = getGlobalStatus(consultation);
              
              return (
                <div 
                  key={consultation.id} 
                  className="bg-white rounded-xl shadow-sm border p-4 transition-all hover:shadow-md"
                  style={{ borderColor: colors.border }}
                >
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                            <FiUser className="inline mr-2" /> Nom patient
                          </label>
                          <input
                            type="text"
                            name="patientName"
                            value={editForm.patientName}
                            onChange={handleEditChange}
                            className="w-full p-2 border rounded-md"
                            style={{ borderColor: colors.border }}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                            <FiPhone className="inline mr-2" /> Téléphone
                          </label>
                          <input
                            type="text"
                            name="patientPhone"
                            value={editForm.patientPhone}
                            onChange={handleEditChange}
                            className="w-full p-2 border rounded-md"
                            style={{ borderColor: colors.border }}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                            <FiCalendar className="inline mr-2" /> Date
                          </label>
                          <input
                            type="date"
                            name="date"
                            value={editForm.date}
                            onChange={handleEditChange}
                            className="w-full p-2 border rounded-md"
                            style={{ borderColor: colors.border }}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                            <FiMapPin className="inline mr-2" /> Adresse
                          </label>
                          <input
                            type="text"
                            name="patientAddress"
                            value={editForm.patientAddress}
                            onChange={handleEditChange}
                            className="w-full p-2 border rounded-md"
                            style={{ borderColor: colors.border }}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={editForm.description}
                            onChange={handleEditChange}
                            className="w-full p-2 border rounded-md"
                            style={{ borderColor: colors.border }}
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                          style={{ borderColor: colors.border }}
                        >
                          <FiX /> Annuler
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent transition-colors shadow-sm"
                        >
                          <FiSave /> Enregistrer
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <FiUser className="text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium" style={{ color: colors.text }}>
                              {consultation.patientName}
                              {consultation.patientAge && (
                                <span className="text-sm ml-2" style={{ color: colors.lightText }}>
                                  ({consultation.patientAge} ans)
                                </span>
                              )}
                            </h3>
                            <p className="text-sm" style={{ color: colors.lightText }}>
                              {consultation.patientPhone}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="text-gray-400" />
                            <span style={{ color: colors.text }}>
                              {consultation.date.toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <FiMapPin className="text-gray-400" />
                            <span style={{ color: colors.text }}>
                              {consultation.patientAddress || 'Non renseignée'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiDollarSign className="text-gray-400" />
                            <span className="font-medium" style={{ color: colors.text }}>
                              {totalCost.toLocaleString()} FCFA
                            </span>
                          </div>
                          
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            globalStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                            globalStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {globalStatus === 'PAID' ? 'Payé' : 
                             globalStatus === 'PARTIAL' ? 'Partiel' : 'Non payé'}
                            {globalStatus === 'PARTIAL' && (
                              <span className="ml-1">
                                ({paidAmount.toLocaleString()}/{totalCost.toLocaleString()})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t" style={{ borderColor: colors.border }}>
                        <button
                          onClick={() => startEditing(consultation)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-gray-50"
                          style={{ color: colors.text }}
                        >
                          <FiEdit size={14} className="text-gray-500" />
                          <span>Modifier</span>
                        </button>
                        <Link
                          href={`/consultations/${consultation.id}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-blue-50"
                          style={{ color: colors.primary }}
                        >
                          <FiEye size={14} className="text-blue-500" />
                          <span>Détails</span>
                        </Link>
                        <Link 
                          href={`/consultations/${consultation.id}/treatments/add`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-green-50"
                          style={{ color: colors.secondary }}
                        >
                          <FiPlus size={14} className="text-green-500" />
                          <span>Ajouter traitement</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}