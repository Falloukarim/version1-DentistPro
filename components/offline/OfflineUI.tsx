'use client';

import { useEffect, useState } from 'react';
import { FiWifiOff, FiRefreshCw } from 'react-icons/fi';

export const OfflineUI = ({ onRetry }: { onRetry: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsVisible(false);
    const handleOffline = () => setIsVisible(true);

    setIsVisible(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/90 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
      <FiWifiOff className="text-red-500 text-6xl mb-4" />
      <h2 className="text-2xl font-bold mb-2">Mode Hors Ligne</h2>
      <p className="text-gray-600 mb-6 text-center">
        Vous travaillez en mode hors ligne. Les modifications seront synchronisées
        lorsque la connexion sera rétablie.
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
      >
        <FiRefreshCw className="animate-spin" /> Réessayer la connexion
      </button>
    </div>
  );
};