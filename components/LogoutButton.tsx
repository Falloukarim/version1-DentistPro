"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs"; // Modification ici

export function LogoutButton() {
  const router = useRouter();
  const { signOut } = useAuth(); // Utilisation de useAuth

  const handleLogout = async () => {
    try {
      // Déconnexion via Clerk
      await signOut();
      // Redirection vers la page de connexion
      router.push('/sign-in');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center text-sm md:text-base text-foreground/80 hover:text-primary transition-colors group"
      aria-label="Déconnexion"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5 mr-1 md:mr-2 group-hover:translate-x-0.5 transition-transform" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span className="hidden md:inline">Déconnexion</span>
    </button>
  );
}