import React from "react";
import { FaTooth, FaBars, FaClinicMedical } from "react-icons/fa";
import { FiShield } from "react-icons/fi";
import { ThemeToggle } from "./ui/ThemeToggle";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  onLogout: () => void;
  onMenuToggle?: () => void;
}

const Navbar = ({ onLogout, onMenuToggle }: NavbarProps) => {
  const { user } = useUser();
  const pathname = usePathname();
  const isSuperAdmin = user?.publicMetadata?.role === 'SUPER_ADMIN';

  return (
    <div className="bg-background border-b border-border px-4 md:px-6 py-3 md:py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button 
            onClick={onMenuToggle}
            className="text-foreground/80 hover:text-primary focus:outline-none transition-colors"
            aria-label="Menu"
          >
            <FaBars className="text-xl" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <FaTooth className="text-primary text-xl" />
          <h1 className="text-lg md:text-xl font-semibold text-foreground">
            <span className="font-light">Cabinet</span> Dentaire
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Menu Admin pour Super Admin */}
        {isSuperAdmin && (
          <div className="hidden md:flex items-center gap-2 border-r border-border pr-4 mr-2">
            <Link 
              href="/admin/super-admin" 
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${
                pathname.startsWith("/admin/super-admin")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <FiShield className="text-base" />
              <span>Admin</span>
            </Link>
            <Link 
              href="/admin/clinics" 
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${
                pathname.startsWith("/admin/clinics")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <FaClinicMedical className="text-base" />
              <span>Cliniques</span>
            </Link>
          </div>
        )}

        <ThemeToggle />
        <button 
          onClick={onLogout}
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
      </div>
    </div>
  );
};

export default Navbar;