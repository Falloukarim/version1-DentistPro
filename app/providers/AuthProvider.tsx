'use client';

import { createContext, useContext } from 'react';
import { User } from '@clerk/nextjs/server';
import { useState, useEffect } from 'react';

// Définissez manuellement les types basés sur votre schéma
interface Clinic {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  isActive: boolean;
}

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'DENTIST' | 'ASSISTANT';

interface AppUser extends User {
  role: Role;
  clinicId?: string;
  isClinicOwner: boolean;
  isActive: boolean;
}

type AuthContextType = {
  user: AppUser;
  currentClinic: Clinic | null;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children, user }: { children: React.ReactNode; user: AppUser }) {
  const [currentClinic, setCurrentClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    const loadClinic = async () => {
      if (user.clinicId) {
        try {
          const response = await fetch(`/api/clinics/${user.clinicId}`);
          if (response.ok) {
            const clinicData = await response.json();
            setCurrentClinic(clinicData);
          }
        } catch (error) {
          console.error('Failed to load clinic:', error);
        }
      }
    };

    loadClinic();
  }, [user.clinicId]);

  return (
    <AuthContext.Provider value={{ user, currentClinic }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};