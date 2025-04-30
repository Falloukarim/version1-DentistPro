import { PrismaClient } from "@prisma/client";

// Déclaration de l'extension de globalThis pour TypeScript
declare global {
  var prisma: PrismaClient | undefined;
}

// Initialisation de Prisma
export const prisma = globalThis.prisma || new PrismaClient();

// En développement, on garde l'instance dans globalThis pour éviter les fuites mémoire
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}