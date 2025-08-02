'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiUser, 
  FiPhone, 
  FiCalendar, 
  FiInfo, 
  FiChevronDown, 
  FiArrowLeft,
  FiClock
} from 'react-icons/fi';
import { addAppointment, fetchConsultations } from '../action';
import type { Consultation } from '@prisma/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Palette de couleurs moderne
const colors = {
  primary: '#4F46E5', // Violet indigo
  secondary: '#10B981', // Vert émeraude
  accent: '#6366F1', // Violet doux
  background: '#F9FAFB', // Gris très clair
  text: '#111827', // Gris foncé
  lightText: '#6B7280', // Gris moyen
  border: '#E5E7EB', // Gris clair
  white: '#FFFFFF'
};

export default function AddAppointmentForm() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    consultationId: '',
    date: '',
    reason: ''
  });

  useEffect(() => {
    async function loadConsultations() {
      try {
        const data = await fetchConsultations();
        setConsultations(data);
        setLoading(false);
      } catch (error) {
        console.error("Erreur de chargement:", error);
        setLoading(false);
      }
    }
    
    loadConsultations();
  }, []);

  const handleConsultationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const consultationId = e.target.value;
    const consultation = consultations.find(c => c.id === consultationId);
    
    setSelectedConsultation(consultation || null);
    setFormData(prev => ({
      ...prev,
      consultationId
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const formDataObj = new FormData();
      formDataObj.append('consultationId', formData.consultationId);
      formDataObj.append('date', formData.date);
      formDataObj.append('reason', formData.reason);
      
      const result = await addAppointment(formDataObj);
      
      if (result?.success) {
        router.push('/appointments');
        router.refresh();
      }
    } catch (error) {
      console.error("Erreur:", error);
      
      if (error instanceof Error) {
        switch (error.message) {
          case "Aucune clinique assignée.":
            alert("Vous devez être assigné à une clinique pour créer un rendez-vous");
            break;
          case "Consultation introuvable.":
            alert("La consultation sélectionnée n'existe plus");
            break;
          default:
            alert(error.message || "Une erreur est survenue");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{ borderColor: colors.primary }}
        ></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4 sm:p-6"
      style={{ backgroundColor: colors.background }}
    >
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/appointments">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-gray-100"
              style={{ color: colors.primary }}
            >
              <FiArrowLeft size={20} />
            </Button>
          </Link>
          <h1 
            className="text-2xl font-bold"
            style={{ color: colors.text }}
          >
            Nouveau Rendez-vous
          </h1>
        </div>
        
        {/* Carte du formulaire */}
        <div 
          className="bg-white rounded-xl shadow-sm p-6"
          style={{ borderColor: colors.border, borderWidth: '1px' }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection de consultation */}
            <div className="space-y-2">
              <label 
                className="block text-sm font-medium"
                style={{ color: colors.text }}
              >
                Consultation associée
              </label>
              <div className="relative">
                <select
                  name="consultationId"
                  value={formData.consultationId}
                  onChange={handleConsultationChange}
                  className="w-full p-3 border rounded-lg appearance-none pr-10 focus:ring-2 focus:ring-primary focus:border-transparent"
                  style={{ 
                    borderColor: colors.border,
                    backgroundColor: colors.white
                  }}
                  required
                >
                  <option value="">Sélectionnez une consultation</option>
                  {consultations.map(consultation => (
                    <option key={consultation.id} value={consultation.id}>
                      {consultation.patientName} - {new Date(consultation.createdAt).toLocaleDateString('fr-FR')}
                    </option>
                  ))}
                </select>
                <FiChevronDown 
                  className="absolute right-3 top-3.5"
                  style={{ color: colors.lightText }}
                />
              </div>
            </div>

            {/* Détails du patient */}
            {selectedConsultation && (
              <div 
                className="p-4 rounded-lg"
                style={{ 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: '1px'
                }}
              >
                <h3 
                  className="text-sm font-medium mb-3"
                  style={{ color: colors.lightText }}
                >
                  Informations du patient
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FiUser 
                        size={16} 
                        style={{ color: colors.lightText }} 
                      />
                      <span 
                        className="text-xs"
                        style={{ color: colors.lightText }}
                      >
                        Nom complet
                      </span>
                    </div>
                    <p style={{ color: colors.text }}>
                      {selectedConsultation.patientName}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FiPhone 
                        size={16} 
                        style={{ color: colors.lightText }} 
                      />
                      <span 
                        className="text-xs"
                        style={{ color: colors.lightText }}
                      >
                        Téléphone
                      </span>
                    </div>
                    <p style={{ color: colors.text }}>
                      {selectedConsultation.patientPhone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Date et heure */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FiCalendar 
                  size={18} 
                  style={{ color: colors.text }} 
                />
                <label 
                  className="block text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  Date et heure du rendez-vous
                </label>
              </div>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                style={{ 
                  borderColor: colors.border,
                  backgroundColor: colors.white
                }}
                required
              />
            </div>

            {/* Motif du rendez-vous */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FiInfo 
                  size={18} 
                  style={{ color: colors.text }} 
                />
                <label 
                  className="block text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  Motif du rendez-vous
                </label>
              </div>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                style={{ 
                  borderColor: colors.border,
                  backgroundColor: colors.white
                }}
                rows={4}
                required
                placeholder="Décrivez la raison de ce rendez-vous..."
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={() => router.push('/appointments')}
                variant="outline"
                className="hover:bg-gray-50"
                style={{ 
                  borderColor: colors.border,
                  color: colors.text
                }}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="hover:bg-primary/90"
                style={{ backgroundColor: colors.primary }}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span 
                      className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    ></span>
                    Enregistrement...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FiClock size={16} />
                    Planifier le rendez-vous
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}