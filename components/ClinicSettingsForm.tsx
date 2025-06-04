'use client'; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Changé pour utiliser sonner
import LogoUpload from './LogoUpload';
import ColorPicker from './ColorPicker';

type ExtendedClinic = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

export default function ClinicSettingsForm({ clinic }: { clinic: ExtendedClinic }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: clinic.name,
    address: clinic.address || '',
    phone: clinic.phone || '',
    email: clinic.email || '',
    logoUrl: clinic.logoUrl || '',
    primaryColor: clinic.primaryColor || '#3b82f6',
    secondaryColor: clinic.secondaryColor || '#8b5cf6'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/clinics/${clinic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          logoUrl: formData.logoUrl || null,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la mise à jour');
      }

      toast.success('Paramètres sauvegardés', {
        description: 'Les modifications ont été enregistrées'
      });
      router.refresh();
    } catch (error) {
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (url: string) => {
    setFormData(prev => ({ ...prev, logoUrl: url }));
    toast.success('Logo mis à jour', {
      description: 'Le logo a été uploadé avec succès'
    });
  };
  
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Identité</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nom de la clinique</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <Label>Adresse</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Logo</h2>
        <LogoUpload
          clinicId={clinic.id}
          currentLogo={clinic.logoUrl}
          onUploadSuccess={handleLogoUpload}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Couleurs du thème</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ColorPicker
            label="Couleur principale"
            value={formData.primaryColor}
            onChange={(color) => setFormData({...formData, primaryColor: color})}
          />
          <ColorPicker
            label="Couleur secondaire"
            value={formData.secondaryColor}
            onChange={(color) => setFormData({...formData, secondaryColor: color})}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.push('/admin/clinics')}
        >
          Retour
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}