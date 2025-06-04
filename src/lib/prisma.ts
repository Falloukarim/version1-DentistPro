// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

// Création d'une instance Prisma unique pour éviter les multiples connexions en dev
const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
