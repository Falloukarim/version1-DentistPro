// app/paydunya/confirmed/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmedPage() {
  const router = useRouter();

  useEffect(() => {
    // Vérifie l'abonnement côté serveur si besoin ici
    const checkAndRedirect = async () => {
      try {
        const res = await fetch("/api/paydunya/verify");
        const data = await res.json();

        if (data.isActive) {
          router.replace("/dashboard");
        } else {
          alert("Paiement non validé. Veuillez réessayer.");
          router.replace("/dashboard");
        }
      } catch (error) {
        console.error("Erreur de redirection :", error);
        router.replace("/dashboard");
      }
    };

    checkAndRedirect();
  }, [router]);

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-semibold mb-4">Paiement en cours de vérification...</h1>
      <p>Vous serez redirigé automatiquement vers votre tableau de bord.</p>
    </div>
  );
}
