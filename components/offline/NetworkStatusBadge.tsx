'use client';

import { useEffect, useState } from 'react';
import { FiWifi, FiWifiOff } from 'react-icons/fi';

export const NetworkStatusBadge = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 ${
      isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
    }`}>
      {isOnline ? <FiWifi /> : <FiWifiOff />}
      {isOnline ? 'En ligne' : 'Hors ligne'}
    </div>
  );
};