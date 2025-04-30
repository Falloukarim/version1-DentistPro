'use client'

import { ReactNode } from 'react'
import { dark } from '@clerk/themes'
import { ClerkProvider as ClerkProviderComponent } from '@clerk/nextjs'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProviderComponent 
      appearance={{ 
        baseTheme: dark,
        variables: {
          colorPrimary: '#3b82f6', // Exemple: bleu Tailwind
          borderRadius: '0.5rem',  // Arrondis cohérents
        }
      }}
    >
      {children}
    </ClerkProviderComponent>
  )
}