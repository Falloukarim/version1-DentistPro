// components/NetworkAwareAuth.tsx
'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNetworkStatus } from 'hooks/useNetworkStatus';
export function NetworkAwareAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  const { redirectToSignIn } = useClerk();
  const { isOnline } = useNetworkStatus();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn && isOnline) {
      redirectToSignIn();
    } else if (!isSignedIn && !isOnline) {
      router.push('/offline');
    }
  }, [isSignedIn, isOnline, redirectToSignIn, router]);

  if (!isSignedIn) {
    return null; // ou un loader
  }

  return <>{children}</>;
}