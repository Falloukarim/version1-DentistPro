'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import Image from 'next/image';

export default function LogoUpload({
  clinicId,
  currentLogo,
  onUploadSuccess
}: {
  clinicId: string;
  currentLogo?: string | null;
  onUploadSuccess: (url: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      // Validation du fichier
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: 'Format invalide',
          description: 'Veuillez sélectionner une image (JPEG, PNG, SVG)',
          variant: 'destructive'
        });
        return;
      }

      if (selectedFile.size > 2 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: 'La taille maximale est de 2MB',
          variant: 'destructive'
        });
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clinicId', clinicId);

      const response = await fetch('/api/clinics/upload-logo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      onUploadSuccess(data.logoUrl);
      toast({
        title: 'Logo mis à jour',
        description: 'Votre logo a été uploadé avec succès'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : "Échec de l'upload",
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [file, clinicId, onUploadSuccess]);

  const handleRemoveLogo = async () => {
    if (!confirm('Supprimer le logo actuel ?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/clinics/upload-logo?clinicId=${clinicId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to remove logo');

      onUploadSuccess('');
      setPreview(null);
      setFile(null);
      toast({
        title: 'Logo supprimé',
        description: 'Le logo a été supprimé avec succès'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Échec de la suppression du logo",
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="relative w-32 h-32 rounded-lg border-2 border-dashed bg-muted/50 flex items-center justify-center overflow-hidden">
          {preview || currentLogo ? (
            <>
              <Image
                src={preview || currentLogo || ''}
                alt="Logo de la clinique"
                fill
                className="object-contain p-2"
                sizes="128px"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleRemoveLogo}
                disabled={isLoading}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center p-4 text-center text-muted-foreground">
              <ImagePlus className="h-8 w-8 mb-2" />
              <span className="text-xs">Aucun logo</span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <Label htmlFor="logo-upload">Choisir un fichier</Label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button
                variant="outline"
                asChild
                disabled={isLoading}
              >
                <label htmlFor="logo-upload" className="cursor-pointer flex items-center gap-2">
                  <UploadCloud className="h-4 w-4" />
                  Parcourir...
                </label>
              </Button>

              {file && (
                <Button
                  onClick={handleUpload}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <span className="animate-pulse">Envoi...</span>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      Envoyer
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Formats acceptés : JPG, PNG, SVG</p>
            <p>Taille max : 2MB</p>
            <p>Dimensions idéales : 300×300 pixels</p>
          </div>
        </div>
      </div>
    </div>
  );
}