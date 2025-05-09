'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaUsers, FaCalendarAlt, FaMoneyBillWave, FaBox, FaTooth, FaClinicMedical, FaTimes } from "react-icons/fa";
import { UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "./ui/ThemeToggle";
import { FiShield } from "react-icons/fi";
import ClinicLogo from "./ClinicLogo";
import { motion } from "framer-motion";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  // Icônes avec couleurs spécifiques
  const menuItems = [
    { 
      path: "/dashboard", 
      name: "Tableau de Bord", 
      icon: <FaHome />,
      color: "text-blue-500",
      activeColor: "text-blue-600"
    },
    { 
      path: "/consultations", 
      name: "Consultations", 
      icon: <FaUsers />,
      color: "text-green-500",
      activeColor: "text-green-600"
    },
    { 
      path: "/appointments", 
      name: "Rendez-vous", 
      icon: <FaCalendarAlt />,
      color: "text-purple-500",
      activeColor: "text-purple-600"
    },
    { 
      path: "/payments", 
      name: "Paiements", 
      icon: <FaMoneyBillWave />,
      color: "text-yellow-500",
      activeColor: "text-yellow-600"
    },
    { 
      path: "/products", 
      name: "Produits", 
      icon: <FaBox />,
      color: "text-red-500",
      activeColor: "text-red-600"
    },
    { 
      path: "/consultations/add", 
      name: "Nouvelle Consultation", 
      icon: <FaTooth />,
      color: "text-teal-500",
      activeColor: "text-teal-600"
    }
  ];

  const isSuperAdmin = isLoaded && user?.publicMetadata?.role === 'SUPER_ADMIN';

  // Variantes d'animation pour Framer Motion
  const iconVariants = {
    hover: {
      rotate: [0, 10, -10, 5, -5, 0],
      transition: { duration: 0.6 }
    }
  };

  // Variantes pour l'effet de survol du texte
  const textVariants = {
    hover: {
      x: 5,
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 10
      }
    }
  };

  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col z-50 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center">
        <ClinicLogo size={80} className="mb-4" />
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
                className={`flex items-center p-3 rounded-lg transition-all group ${
                  pathname === item.path
                    ? "bg-primary/10 text-primary font-medium border border-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <motion.span
                  className={`mr-3 p-2 rounded-lg ${
                    pathname === item.path 
                      ? `bg-primary ${item.activeColor}`
                      : `bg-accent ${item.color}`
                  }`}
                  variants={iconVariants}
                  whileHover="hover"
                >
                  {item.icon}
                </motion.span>
                <motion.span
                  className="relative"
                  variants={textVariants}
                  whileHover="hover"
                >
                  {item.name}
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full"></span>
                </motion.span>
                {pathname === item.path && (
                  <span className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                )}
              </Link>
            </li>
          ))}
          
          {isSuperAdmin && (
            <>
              <li className="mt-6 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administration
              </li>
              <li>
                <Link 
                  href="/admin/super-admin" 
                  className={`flex items-center p-3 rounded-lg transition-all group ${
                    pathname.startsWith("/admin/super-admin")
                      ? "bg-primary/10 text-primary font-medium border border-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <motion.span
                    className={`mr-3 p-2 rounded-lg ${
                      pathname.startsWith("/admin/super-admin") 
                        ? "bg-primary text-indigo-600"
                        : "bg-accent text-indigo-500"
                    }`}
                    variants={iconVariants}
                    whileHover="hover"
                  >
                    <FiShield />
                  </motion.span>
                  <motion.span
                    variants={textVariants}
                    whileHover="hover"
                  >
                    Admin Système
                  </motion.span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/clinics" 
                  className={`flex items-center p-3 rounded-lg transition-all group ${
                    pathname.startsWith("/admin/clinics")
                      ? "bg-primary/10 text-primary font-medium border border-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <motion.span
                    className={`mr-3 p-2 rounded-lg ${
                      pathname.startsWith("/admin/clinics") 
                        ? "bg-primary text-cyan-600"
                        : "bg-accent text-cyan-500"
                    }`}
                    variants={iconVariants}
                    whileHover="hover"
                  >
                    <FaClinicMedical />
                  </motion.span>
                  <motion.span
                    variants={textVariants}
                    whileHover="hover"
                  >
                    Gestion Cliniques
                  </motion.span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              variants={iconVariants}
              whileHover="hover"
            >
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 border border-border shadow-sm",
                    userButtonPopoverCard: "shadow-xl bg-background"
                  }
                }}
              />
            </motion.div>
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