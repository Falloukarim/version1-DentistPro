'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const router = useRouter();
  const { signOut } = useClerk();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // assume mobile by default
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // open on desktop, closed on mobile
    };

    checkMobile();
    setHasMounted(true);

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Prevent SSR hydration mismatch
  if (!hasMounted) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50 transform' : 'relative'}
        transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-300 ease-in-out
      `}>
      </div>

      {/* Overlay pour mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Contenu principal */}
      <div className={`
        flex-1 flex flex-col overflow-hidden
        ${sidebarOpen && !isMobile ? 'ml-64' : ''}
        transition-all duration-300 ease-in-out
      `}>
        <Navbar 
          onLogout={handleLogout}
          onMenuToggle={toggleSidebar}
          showMenuButton={isMobile || !sidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
