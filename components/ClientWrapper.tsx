'use client';

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useNavigation } from "./ui/NavigationContext";
import LoadingSpinner from "./ui/LoadingSpinner";
import { OfflineUI } from "./offline/OfflineUI";
import { NetworkStatusBadge } from "./offline/NetworkStatusBadge";

type Clinic = {
  id: string;
  name?: string;
  // Ajoute d'autres propriétés si nécessaires
};

interface ClientWrapperProps {
  children: React.ReactNode;
  clinic?: Clinic | null;
}

export default function ClientWrapper({ children, clinic }: ClientWrapperProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isNavigating, setNavigating } = useNavigation();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href.startsWith(window.location.origin)) {
        setNavigating(true);
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [setNavigating]);

  useEffect(() => {
    setNavigating(false);
  }, [pathname, searchParams, setNavigating]);

  return (
    <>
      {/* Composants Offline interactifs */}
      <OfflineUI onRetry={() => window.location.reload()} />
      <NetworkStatusBadge />
      {clinic?.name}

      <AnimatePresence mode="wait">
        {/* Overlay de chargement */}
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto'
            }}
          >
            <LoadingSpinner size="lg" />
          </motion.div>
        )}

        {/* Contenu principal */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
