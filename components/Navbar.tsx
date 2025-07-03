import React from "react";
import { FaBars, FaClinicMedical } from "react-icons/fa";
import { ThemeToggle } from "./ui/ThemeToggle";
import AdminLinks from "./AdminLinks";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton"; // Importez le nouveau composant
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import ClinicLogo from "./ClinicLogo";

interface NavbarProps {
  onMenuToggle?: () => void;
  userRole: string;
  userId?: string;
  // Retirez onLogout des props
}

const Navbar = ({ onMenuToggle, userRole }: NavbarProps) => {
  return (
    <div className="bg-background border-b border-border px-4 md:px-6 py-3 md:py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        {userRole === 'SUPER_ADMIN' && (
          <Link 
            href="/admin/clinics" 
            className="flex items-center text-sm md:text-base text-foreground/80 hover:text-primary transition-colors group"
            aria-label="Gestion des cliniques"
          >
            <span className="hidden md:inline">Cliniques</span>
          </Link>
        )}
        {onMenuToggle && (
          <button 
            onClick={onMenuToggle}
            className="text-foreground/80 hover:text-primary focus:outline-none transition-colors"
            aria-label="Menu"
          >
          </button>
        )}
        <div className="flex items-center gap-3">
          <AdminLinks />
          <h1 className="text-lg md:text-xl font-semibold text-foreground">
            <span className="font-light">Cabinet</span> Medical
          </h1>
        </div>
          <ClinicLogo />
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <LogoutButton /> {/* Utilisez le nouveau composant ici */}
      </div>
    </div>
  );
};

export default Navbar;