// app/admin/super-admin/components/ClinicManagement.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Clinic {
  id: string;
  name: string;
  users?: User[];
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  clinicId?: string;
}

export default function ClinicManagement({ 
  clinics, 
  users 
}: {
  clinics: Clinic[];
  users: User[];
}) {
  const [newClinicName, setNewClinicName] = useState('');
  const router = useRouter();

  const handleCreateClinic = async () => {
    await fetch('/api/clinics', {
      method: 'POST',
      body: JSON.stringify({ name: newClinicName })
    });
    router.refresh();
  };

  const handleAssignUser = async (userId: string, clinicId: string) => {
    await fetch('/api/clinics/assign', {
      method: 'POST',
      body: JSON.stringify({ userId, clinicId })
    });
    router.refresh();
  };

  return (
    <div className="bg-card p-4 rounded-lg border">
      <h2 className="text-xl font-semibold mb-4">Gestion des Cliniques</h2>
      
      <div className="flex gap-2 mb-4">
        <Input
          value={newClinicName}
          onChange={(e) => setNewClinicName(e.target.value)}
          placeholder="Nom de la nouvelle clinique"
        />
        <Button onClick={handleCreateClinic}>Créer</Button>
      </div>

      <div className="space-y-4">
        {clinics.map(clinic => (
          <div key={clinic.id} className="p-4 border rounded-lg">
            <h3 className="font-medium">{clinic.name}</h3>
            <p className="text-sm text-muted-foreground">
              {clinic.users?.length || 0} utilisateurs
            </p>
            
            <select
              className="mt-2 w-full p-2 border rounded"
              onChange={(e) => handleAssignUser(e.target.value, clinic.id)}
              defaultValue=""
            >
              <option value="" disabled>Assigner un utilisateur</option>
              {users
                .filter(user => user.clinicId !== clinic.id)
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.role})
                  </option>
                ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}