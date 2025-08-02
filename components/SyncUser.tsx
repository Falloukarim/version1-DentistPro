'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { syncUserAction } from 'app/actions/sync-user';

export default function SyncUser() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      syncUserAction(user.id, user).catch(console.error);
    }
  }, [isLoaded, user]);

  return null;
}