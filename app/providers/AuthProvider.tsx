// app/providers/AuthProvider.tsx
'use client';

import { createContext, useContext } from 'react';
import { User } from '@clerk/nextjs/server';
import { useState, useEffect } from 'react';

type AuthContextType = {
  user: User & { role: string; clinicId?: string };
  currentClinic: Clinic | null;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children, user }: { children: React.ReactNode; user: User }) {
  const [currentClinic, setCurrentClinic] = useState<Clinic | null>(null);

  // Charge la clinique au premier rendu
  useEffect(() => {
    if (user.clinicId) {
      fetchClinic(user.clinicId).then(setCurrentClinic);
    }
  }, [user.clinicId]);

  return (
    <AuthContext.Provider value={{ user, currentClinic }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);