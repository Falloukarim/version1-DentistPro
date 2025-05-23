// app/sign-in/[[...sign-in]]/page.tsx
'use client';

import { SignIn } from "@clerk/nextjs";
import { useNetworkStatus } from "hooks/useNetworkStatus";
import { OfflineFallback } from "components/OfflineFallback";

export default function Page() {
  const { isOnline } = useNetworkStatus();

  if (!isOnline) {
    return <OfflineFallback />;
  }

  return (
    <div className="flex justify-center py-24">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "border-border shadow-lg",
          }
        }}
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
      />
    </div>
  );
}