import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Définition du type de transaction Prisma
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function POST(
  request: Request,
  { params }: { params: { id: string } } // Destructuration directe
) {
  try {
    const productId = params.id; // Accès direct après destructuration

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { clinic: true }
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'Aucune clinique assignée' }, { status: 403 });
    }

    const updatedProduct = await prisma.$transaction(async (tx: TransactionClient) => {
      const product = await tx.product.findUnique({
        where: {
          id: productId,
          clinicId: user.clinicId
        }
      });

      if (!product) throw new Error('Produit non trouvé');
      if (product.disponible <= 0) throw new Error('Stock épuisé');

      return await tx.product.update({
        where: { id: productId },
        data: {
          used: { increment: 1 },
          disponible: { decrement: 1 },
          updatedAt: new Date()
        }
      });
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Erreur lors de l\'utilisation du produit:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 400 }
    );
  }
}