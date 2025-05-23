'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SyncService } from 'services/syncService';
import { offlineDB } from '@/lib/offlineDB';

export function OfflineAuthHandler() {
  const { isSignedIn, user } = useUser();
  const { redirectToSignIn } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleAuth = async () => {
      if (pathname.startsWith('/sign-in')) return;
      if (typeof window === 'undefined') return;

      try {
        const dbReady = await offlineDB.safeOpen();
        if (!dbReady) {
          if (!navigator.onLine && pathname !== '/offline') {
            router.push('/offline');
          }
          return;
        }

        if (isSignedIn && user) {
          await handleSignedInUser(user);
        } else if (!navigator.onLine) {
          await handleOfflineMode();
        } else {
          redirectToSignIn();
        }
      } catch (error) {
        console.error('Auth handler error:', error);
        if (!navigator.onLine && pathname !== '/offline') {
          router.push('/offline');
        }
      }
    };

    const handleSignedInUser = async (user: any) => {
      await cacheUser(user);
      if (navigator.onLine) {
        try {
          await SyncService.syncAll(user.id);
          SyncService.startSyncListeners(user.id);
        } catch (syncError) {
          console.error('Sync failed:', syncError);
        }
      }
    };

    const handleOfflineMode = async () => {
      const cachedUser = await offlineDB.users
        .orderBy('lastSynced')
        .reverse()
        .first();

      if (!cachedUser && pathname !== '/offline') {
        router.push('/offline');
      }
    };

    handleAuth();
  }, [isSignedIn, pathname, redirectToSignIn, router, user]);

  return null;
}

async function cacheUser(user: any) {
  try {
    const userData = {
      id: user.id,
      clerkUserId: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.primaryEmailAddress?.emailAddress || '',
      role: user.publicMetadata?.role || 'USER',
      clinicId: user.publicMetadata?.clinicId || null,
      syncStatus: 'synced' as const,
      lastSynced: new Date().toISOString()
    };

    const existing = await offlineDB.users.get(user.id);
    if (existing) {
      await offlineDB.users.update(user.id, userData);
    } else {
      await offlineDB.users.add(userData);
    }
  } catch (error) {
    console.error('Failed to cache user:', error);
  }
}