'use client';

import { useEffect, useState } from 'react';
import { FiRefreshCw, FiCheck } from 'react-icons/fi';
import { offlineDB } from '@/lib/offlineDB';
import { SyncService } from 'services/syncService';

export function SyncIndicator({ clinicId }: { clinicId: string }) {
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePendingCount = async () => {
      try {
        await offlineDB.safeOpen();
        const pendingItems = await offlineDB.getPendingSyncItems();
        setPendingSyncs(
          pendingItems.consultations.length +
          pendingItems.treatments.length +
          pendingItems.payments.length
        );
      } catch (error) {
        console.error('Error getting pending sync count:', error);
      }
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);
  const handleSync = async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      await SyncService.syncAll(clinicId);
      setLastSync(new Date());
      setPendingSyncs(0);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isMounted) return null;

  if (pendingSyncs === 0 && lastSync) {
    return (
      <div className="fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm">
        <FiCheck /> Synchronisé à {lastSync.toLocaleTimeString()}
      </div>
    );
  }

  if (pendingSyncs === 0) return null;

  return (
    <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
      {isSyncing ? (
        <FiRefreshCw className="animate-spin" />
      ) : (
        <button onClick={handleSync} className="flex items-center gap-2">
          <FiRefreshCw /> Synchroniser ({pendingSyncs})
        </button>
      )}
    </div>
  );
}