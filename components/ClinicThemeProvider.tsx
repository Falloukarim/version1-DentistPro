// components/ClinicThemeProvider.tsx
'use client'

import { createContext, useContext, useEffect } from 'react'

interface Clinic {
  id: string
  name: string
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
}

interface ClinicContextType {
  clinic: Clinic | null
  primaryColor: string
  secondaryColor: string
}

const defaultColors = {
  primary: '#3b82f6',
  secondary: '#8b5cf6'
}

const ClinicContext = createContext<ClinicContextType>({ 
  clinic: null,
  primaryColor: defaultColors.primary,
  secondaryColor: defaultColors.secondary
})

export function ClinicThemeProvider({
  children,
  clinic,
}: {
  children: React.ReactNode
  clinic: Clinic | null
}) {
  const primary = clinic?.primaryColor || defaultColors.primary
  const secondary = clinic?.secondaryColor || defaultColors.secondary

  useEffect(() => {
    // Convertir les couleurs hex en HSL si nécessaire
    document.documentElement.style.setProperty('--primary', primary)
    document.documentElement.style.setProperty('--primary-foreground', secondary)
    
    // Pour les éléments spécifiques qui utilisent ces couleurs
    document.documentElement.style.setProperty('--clinic-primary', primary)
    document.documentElement.style.setProperty('--clinic-secondary', secondary)
  }, [primary, secondary])

  return (
    <ClinicContext.Provider value={{ 
      clinic, 
      primaryColor: primary,
      secondaryColor: secondary
    }}>
      {children}
    </ClinicContext.Provider>
  )
}

export const useClinic = () => {
  const context = useContext(ClinicContext)
  if (!context) {
    throw new Error('useClinic must be used within a ClinicThemeProvider')
  }
  return context
}