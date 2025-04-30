'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiPhone, FiCalendar, FiInfo, FiChevronDown, FiArrowLeft } from 'react-icons/fi';
import { addAppointment, fetchConsultations } from '../action';
import type { Consultation } from '@prisma/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AddAppointmentForm() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
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
    
    try {
      // Créer un objet FormData et y ajouter les valeurs
      const formDataObj = new FormData();
      formDataObj.append('consultationId', formData.consultationId);
      formDataObj.append('date', formData.date);
      formDataObj.append('reason', formData.reason);
      
      await addAppointment(formDataObj);
      router.push('/appointments');
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-md p-6 border">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link href="/appointments">
            <FiArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Nouveau Rendez-vous</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Sélectionner une consultation
          </label>
          <div className="relative">
            <select
              name="consultationId"
              value={formData.consultationId}
              onChange={handleConsultationChange}
              className="w-full p-2 border rounded-md appearance-none pr-8 bg-background"
              required
            >
              <option value="">Sélectionnez une consultation</option>
              {consultations.map(consultation => (
                <option key={consultation.id} value={consultation.id}>
                  {consultation.patientName} - {new Date(consultation.createdAt).toLocaleDateString('fr-FR')}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-3 text-muted-foreground" />
          </div>
        </div>

        {selectedConsultation && (
          <div className="bg-accent p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center">
                  <FiUser className="mr-2" /> Nom du patient
                </label>
                <p className="text-foreground">{selectedConsultation.patientName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center">
                  <FiPhone className="mr-2" /> Téléphone
                </label>
                <p className="text-foreground">{selectedConsultation.patientPhone}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1 flex items-center">
            <FiCalendar className="mr-2" /> Date et heure
          </label>
          <input
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full p-2 border rounded-md bg-background"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1 flex items-center">
            <FiInfo className="mr-2" /> Motif du rendez-vous
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            className="w-full p-2 border rounded-md bg-background"
            rows={3}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={() => router.push('/appointments')}
            variant="outline"
          >
            Annuler
          </Button>
          <Button type="submit">
            Enregistrer le rendez-vous
          </Button>
        </div>
      </form>
    </div>
  );
}