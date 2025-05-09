// components/ClinicLogo.tsx
'use client'

import Image from 'next/image'
import { useClinic } from './ClinicThemeProvider'

interface ClinicLogoProps {
  size?: number
  className?: string
}

export default function ClinicLogo({ 
  size = 40, 
  className = '' 
}: ClinicLogoProps) {
  const { clinic } = useClinic()

  // Si pas de logo, on affiche une initiale
  if (!clinic?.logoUrl) {
    return (
      <div 
        className={`rounded-full bg-gray-200 flex items-center justify-center ${className}`}
        style={{ 
          width: size, 
          height: size,
          backgroundColor: clinic?.primaryColor || '#f3f4f6'
        }}
      >
        <span 
          className="font-semibold"
          style={{ color: clinic?.secondaryColor || '#6b7280' }}
        >
          {clinic?.name.charAt(0) || 'C'}
        </span>
      </div>
    )
  }

  // Si logo existe, on l'affiche
  return (
    <div 
      className={`relative ${className}`} 
      style={{ width: size, height: size }}
    >
      <Image
        src={clinic.logoUrl}
        alt={`Logo ${clinic.name}`}
        fill
        className="object-contain"
        sizes={`${size}px`}
        priority
      />
    </div>
  )
}