'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaUsers, FaCalendarAlt, FaMoneyBillWave, FaBox, FaTooth, FaClinicMedical, FaTimes } from "react-icons/fa";
import { UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "./ui/ThemeToggle";
import { FiShield } from "react-icons/fi";
import ClinicLogo from "./ClinicLogo";
import { motion } from "framer-motion";
import { useClinic } from "./ClinicThemeProvider";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { clinic } = useClinic();

  const menuItems = [
    { path: "/dashboard", name: "Tableau de Bord", icon: <FaHome /> },
    { path: "/consultations", name: "Consultations", icon: <FaUsers /> },
    { path: "/appointments", name: "Rendez-vous", icon: <FaCalendarAlt /> },
    { path: "/payments", name: "Paiements", icon: <FaMoneyBillWave /> },
    { path: "/products", name: "Produits", icon: <FaBox /> }
  ];

  const isSuperAdmin = isLoaded && user?.publicMetadata?.role === 'SUPER_ADMIN';

  const iconVariants = {
    hover: {
      rotate: [0, 10, -10, 5, -5, 0],
      transition: { duration: 0.6 }
    }
  };

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
    <div className="w-64 bg-custom-gradient h-full flex flex-col z-50 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center">
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden text-white hover:text-gray-200 transition"
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
                    ? "bg-white/10 text-white font-medium border border-white/20"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <motion.span
                  className={`mr-3 p-2 rounded-lg ${
                    pathname === item.path 
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-white"
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
                  <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></span>
                )}
              </Link>
            </li>
          ))}

          {isSuperAdmin && (
            <>
              <li className="mt-6 mb-2 px-3 text-xs font-semibold text-white uppercase tracking-wider">
                Administration
              </li>
              <li>
                <Link 
                  href="/admin/super-admin" 
                  className={`flex items-center p-3 rounded-lg transition-all group ${
                    pathname.startsWith("/admin/super-admin")
                      ? "bg-white/10 text-white font-medium border border-white/20"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <motion.span
                    className={`mr-3 p-2 rounded-lg ${
                      pathname.startsWith("/admin/super-admin") 
                        ? "bg-white/20 text-white"
                        : "bg-white/10 text-white"
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
                      ? "bg-white/10 text-white font-medium border border-white/20"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <motion.span
                    className={`mr-3 p-2 rounded-lg ${
                      pathname.startsWith("/admin/clinics") 
                        ? "bg-white/20 text-white"
                        : "bg-white/10 text-white"
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

            <span className="text-sm text-white">Mon Profil</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="text-xs text-white text-center">
          v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;