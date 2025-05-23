// app/online-check/layout.tsx
'use client';

import { useNetworkStatus } from "hooks/useNetworkStatus";
import { OfflineFallback } from "components/OfflineFallback";

export default function OnlineCheckLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOnline } = useNetworkStatus();

  if (!isOnline) {
    return <OfflineFallback />;
  }

  return <>{children}</>;
}