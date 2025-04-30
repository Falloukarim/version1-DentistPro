'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaUsers, FaCalendarAlt, FaMoneyBillWave, FaBox, FaTooth, FaClinicMedical, FaTimes } from "react-icons/fa";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./ui/ThemeToggle";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const pathname = usePathname();

  const menuItems = [
    { path: "/dashboard", name: "Tableau de Bord", icon: <FaHome /> },
    { path: "/consultations", name: "Consultations", icon: <FaUsers /> },
    { path: "/appointments", name: "Rendez-vous", icon: <FaCalendarAlt /> },
    { path: "/payments", name: "Paiements", icon: <FaMoneyBillWave /> },
    { path: "/products", name: "Produits", icon: <FaBox /> },
    { path: "/consultations/add", name: "Nouvelle Consultation", icon: <FaTooth /> }
  ];

  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col z-50 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary flex items-center">
          <FaClinicMedical className="mr-3" />
          <span>Dentist-Pro</span>
        </h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden text-muted-foreground hover:text-foreground transition"
            aria-label="Fermer le menu"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                onClick={onClose}
                className={`flex items-center p-3 rounded-lg transition-all ${
                  pathname === item.path
                    ? "bg-primary/10 text-primary font-medium border border-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span className={`mr-3 p-2 rounded-lg ${
                  pathname === item.path 
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                }`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
                {pathname === item.path && (
                  <span className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 border border-border shadow-sm",
                  userButtonPopoverCard: "shadow-xl bg-background"
                }
              }}
            />
            <span className="text-sm text-foreground">Mon Profil</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="text-xs text-muted-foreground text-center">
          v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;