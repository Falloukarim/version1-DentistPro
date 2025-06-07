'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useNavigation } from './ui/NavigationContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useMobile from './hooks/useMobile';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const router = useRouter();
  const { signOut } = useClerk();
  const { setNavigating } = useNavigation();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    setNavigating(true);
    await signOut();
    router.push('/');
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar - caché sur mobile sauf si ouvert */}
      {(!isMobile || sidebarOpen) && (
        <div className={`${isMobile ? 'fixed inset-0 z-50' : ''}`}>
          <Sidebar onClose={isMobile ? toggleSidebar : undefined} />
        </div>
      )}

      {/* Overlay pour mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar avec bouton menu pour mobile */}
        <Navbar 
          onLogout={handleLogout}
          onMenuToggle={isMobile ? toggleSidebar : undefined} 
          userRole={''}
        />
        
        {/* Page Content - utilise le défilement du parent */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;