'use client';

import { useRouter } from 'next/navigation';
import { getClinics } from '../../app/actions/clinic.actions';
import { useEffect, useState } from 'react';
import { Select, SelectItem } from '@/components/ui/select';

export function ClinicSelector() {
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function loadClinics() {
      const data = await getClinics();
      setClinics(data);

      // Définir uniquement si rien n'est sélectionné
      if (data.length > 0 && !selectedClinic) {
        setSelectedClinic(data[0].id);
      }
    }

    loadClinics();
  }, [selectedClinic]); // ← maintenant safe, car conditionnel dans useEffect

  const handleChange = (value: string) => {
    setSelectedClinic(value);
    router.refresh(); // Recharge les données du dashboard
  };

  if (clinics.length <= 1) return null;

  return (
    <Select value={selectedClinic} onValueChange={handleChange}>
      {clinics.map(clinic => (
        <SelectItem key={clinic.id} value={clinic.id}>
          {clinic.name}
        </SelectItem>
      ))}
    </Select>
  );
}
