'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Trash2, Settings } from 'lucide-react';
import Image from 'next/image';
import { Dialog } from '@/components/ui/dialog';
import { Clinic } from 'app/types/clinic';
import { useState } from 'react';

interface ClinicListProps {
  clinics: Clinic[];
  isLoading: boolean;
  onDeleteSuccess: () => void;
}

export default function ClinicList({ clinics, isLoading, onDeleteSuccess }: ClinicListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDeleteClinic(id: string): Promise<void> {
    if (!confirm("Es-tu sûr de vouloir supprimer cette clinique ?")) return;

    try {
      setDeletingId(id);

      const res = await fetch(`/api/admin/clinics/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Échec de la suppression");
      }

      onDeleteSuccess();
    } catch (err: any) {
      alert(err.message || "Une erreur est survenue lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {isLoading ? (
        <div className="col-span-full flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : clinics.length === 0 ? (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          Aucune clinique trouvée
        </div>
      ) : (
        clinics.map((clinic) => (
          <div key={clinic.id} className="border p-4 rounded-lg flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-grow">
                <h3 className="font-medium text-lg">{clinic.name}</h3>
                {clinic.address && <p className="text-sm text-muted-foreground mt-1">{clinic.address}</p>}
              </div>
              {clinic.logoUrl && (
                <div className="relative h-10 w-10 rounded-md overflow-hidden border">
                  <Image
                    src={clinic.logoUrl}
                    alt={`Logo ${clinic.name}`}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Link
                href={`/admin/clinics/${clinic.id}/settings`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full gap-2">
                  <Settings className="h-4 w-4" />
                  Personnaliser
                </Button>
              </Link>

              <AssignUserDialog clinicId={clinic.id} clinicName={clinic.name} />

              <Button
                variant="destructive"
                onClick={() => handleDeleteClinic(clinic.id)}
                disabled={isLoading || deletingId === clinic.id}
                className="w-full sm:w-auto gap-1"
              >
                <Trash2 className="h-4 w-4" />
                {deletingId === clinic.id ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
