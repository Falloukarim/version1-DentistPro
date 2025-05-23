// components/OfflineFallback.tsx
'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useNetworkStatus } from "hooks/useNetworkStatus";
import { Loader2 } from "lucide-react";

export function OfflineFallback() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();

  // Rediriger automatiquement vers la page de connexion quand la connexion revient
  useEffect(() => {
    if (isOnline) {
      router.push('/sign-in');
    }
  }, [isOnline, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-yellow-500"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            <line x1="23" y1="1" x2="1" y2="23" stroke="red" />
          </svg>
          
          <h1 className="text-2xl font-bold text-foreground">
            Mode Hors Ligne
          </h1>
          
          <p className="text-muted-foreground">
            Vous êtes actuellement hors ligne. La page de connexion nécessite une connexion internet.
          </p>
          
          {!isOnline ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>En attente de connexion...</span>
            </div>
          ) : (
            <p className="text-sm text-green-500">
              Connexion rétablie, redirection en cours...
            </p>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Retour
            </Button>
            
            <Button
              onClick={() => router.refresh()}
              disabled={!isOnline}
            >
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}