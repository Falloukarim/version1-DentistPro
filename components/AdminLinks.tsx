'use client'

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminLinks() {
  const { user, isLoaded } = useUser();
  const [showLinks, setShowLinks] = useState(false);
  console.log('User data:', user);
  console.log('Is loaded:', isLoaded);
  console.log('Public metadata:', user?.publicMetadata);
  useEffect(() => {
    if (isLoaded && user) {
      const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(
        user.publicMetadata?.role as string
      );
      setShowLinks(isAdmin);
    }
  }, [user, isLoaded]);

  if (!showLinks) return null;
  
  return (
    <div className="hidden md:flex items-center gap-2 border-r border-border pr-4 mr-2">
      {user?.publicMetadata?.role === 'SUPER_ADMIN' && (
        <Link href="/admin/super-admin" className="px-3 py-1 rounded-md text-sm">
          Super Admin
        </Link>
      )}
      <Link href="/admin/clinics" className="px-3 py-1 rounded-md text-sm">
        Gestion Cliniques
      </Link>
    </div>
  );
}