'use client';

import { FiUser, FiPhone, FiCalendar, FiMapPin, FiSave, FiX } from 'react-icons/fi';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { addConsultation, getAvailableDentists } from '../action';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending} className="gap-2">
      {pending ? (
        <>
          <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          Enregistrement...
        </>
      ) : (
        <>
          <FiSave />
          Enregistrer
        </>
      )}
    </Button>
  );
}

export default function NewConsultationPage() {
  const [dentists, setDentists] = useState<Awaited<ReturnType<typeof getAvailableDentists>>>([]);
  const [state, formAction] = useActionState(addConsultation, null);
  const router = useRouter();
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    const fetchDentists = async () => {
      try {
        const data = await getAvailableDentists();
        setDentists(data);
      } catch (error) {
        console.error('Failed to load dentists:', error);
      }
    };
    fetchDentists();
  }, []);

  useEffect(() => {
    if (state?.success) {
      router.push('/consultations');
      router.refresh();
    }
  }, [state, router]);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^(77|76|70|78|75)[0-9]{7}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('Numéro Sénégalais invalide (77xxxxxxx, 76xxxxxxx...)');
      return false;
    }
    setPhoneError('');
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-foreground flex items-center">
            <FiUser className="mr-2 text-primary" />
            Nouvelle Consultation
          </h2>
        </div>

        <div className="p-6">
          {state?.error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <FiUser className="mr-2 text-muted-foreground" />
                  Nom complet <span className="text-destructive ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="patientName"
                  required
                  minLength={2}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <FiPhone className="mr-2 text-muted-foreground" />
                  Téléphone <span className="text-destructive ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="patientPhone"
                  required
                  pattern="^(77|76|70|78|75)[0-9]{7}$"
                  title="Numéro Sénégalais valide (77xxxxxxx, 76xxxxxxx...)"
                  className={`w-full p-3 border ${phoneError ? 'border-destructive' : 'border-input'} rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background`}
                  onBlur={(e) => validatePhone(e.target.value)}
                />
                {phoneError && (
                  <p className="mt-1 text-sm text-destructive">{phoneError}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Format: 77xxxxxxx, 76xxxxxxx, 70xxxxxxx, 78xxxxxxx ou 75xxxxxxx
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <FiCalendar className="mr-2 text-muted-foreground" />
                  Date <span className="text-destructive ml-1">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <FiMapPin className="mr-2 text-muted-foreground" />
                  Adresse
                </label>
                <input
                  type="text"
                  name="patientAddress"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Âge
                </label>
                <input
                  type="number"
                  name="patientAge"
                  min="0"
                  max="120"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Genre
                </label>
                <select
                  name="patientGender"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                >
                  <option value="">Sélectionner</option>
                  <option value="Masculin">Masculin</option>
                  <option value="Féminin">Féminin</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-foreground">
                  Dentiste <span className="text-destructive ml-1">*</span>
                </label>
                <select
                  name="dentistId"
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                  disabled={dentists.length === 0}
                >
                  <option value="">Sélectionner un dentiste</option>
                  {dentists.map(dentist => (
                    <option key={dentist.id} value={dentist.id}>
                      {dentist.firstName} {dentist.lastName}
                    </option>
                  ))}
                </select>
                {dentists.length === 0 && (
                  <p className="text-sm text-warning mt-1">Chargement des dentistes...</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                name="description"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                rows={3}
                maxLength={500}
              />
            </div>

            <input type="hidden" name="isPaid" value="true" />

            <div className="pt-4 flex justify-end gap-3">
              <Button asChild variant="outline">
                <Link href="/consultations">
                  <FiX className="mr-2" />
                  Annuler
                </Link>
              </Button>
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}