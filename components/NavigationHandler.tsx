'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useNavigation } from './ui/NavigationContext';

export function NavigationHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setNavigating } = useNavigation();

  useEffect(() => {
    setNavigating(false); // Reset quand la navigation est complète
  }, [pathname, searchParams, setNavigating]);

  useEffect(() => {
    // Intercepte tous les clics sur les liens
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.href.startsWith(window.location.origin)) {
        setNavigating(true);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [setNavigating]);

  return null;
}