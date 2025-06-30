import React from "react";
import { FaBars, FaClinicMedical } from "react-icons/fa";
import AdminLinks from "./AdminLinks";
import Link from "next/link";
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
            <FaClinicMedical className="h-5 w-5 mr-1 md:mr-2 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">Cliniques</span>
          </Link>
        )}
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
          <AdminLinks />
          <h1 className="text-lg md:text-xl font-semibold text-foreground">
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-4">
                  <ClinicLogo size={40} className="mb-4 m-2 p-2" />
      </div>
    </div>
  );
};

export default Navbar;