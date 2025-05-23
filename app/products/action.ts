'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  used: number;
  disponible : number;
  clinicId: string;
  updatedAt: Date;
  clinic?: {
    name: string;
  };
}

// Récupérer l'utilisateur avec sa clinique
async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error('Non autorisé');

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { clinic: true }
  });

  if (!user) throw new Error('Utilisateur non trouvé');
  if (!user.clinicId && user.role !== 'SUPER_ADMIN') {
    throw new Error('Aucune clinique assignée');
  }
  return user;
}

// Récupérer tous les produits
export async function fetchProducts(): Promise<Product[]> {
  const user = await getCurrentUser();

  const whereClause = user.role === 'SUPER_ADMIN' 
    ? {}
    : { clinicId: user.clinicId };

  return await prisma.product.findMany({
    where: whereClause,
    include: {
      clinic: user.role === 'SUPER_ADMIN' ? { select: { name: true } } : false
    },
    orderBy: { updatedAt: 'desc' }
  });
}

// Ajouter un produit
// Dans action.ts
export async function addProduct(data: {
  name: string;
  price: number;
  stock: number;
  description?: string;
}): Promise<Product> {
  const user = await getCurrentUser();

  if (!user.clinicId && user.role !== 'SUPER_ADMIN') {
    throw new Error('Produits réservés aux cliniques');
  }

  const existingProduct = await prisma.product.findFirst({
    where: {
      name: data.name,
      clinicId: user.clinicId!
    }
  });

  if (existingProduct) {
    throw new Error('Un produit avec ce nom existe déjà dans votre clinique');
  }

  const newProduct = await prisma.product.create({
    data: {
      ...data,
      clinicId: user.clinicId!,
      used: 0,
      disponible: data.stock // Ajout de cette ligne pour initialiser disponible
    },
    include: {
      clinic: user.role === 'SUPER_ADMIN' ? { select: { name: true } } : false
    }
  });

  revalidatePath('/products');
  return newProduct;
}

// Utiliser un produit (décrémente le stock)
export async function useProduct(productId: string): Promise<Product> {
  const user = await getCurrentUser();

  return await prisma.$transaction(async (prisma) => {
    // 1. Vérification du stock disponible
    const product = await prisma.product.findUnique({
      where: { 
        id: productId,
        clinicId: user.clinicId 
      }
    });
    if (!product) throw new Error('Produit non trouvé');
    if (product.stock - product.used <= 0) throw new Error('Stock épuisé');

    // 2. Mise à jour atomique
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { 
        used: { increment: 1 },
        disponible: { decrement: 1 }, // Maintient la cohérence
        updatedAt: new Date() 
      },
      include: { clinic: true }
    });

    return updatedProduct;
  });
}

// Réapprovisionner un produit
export async function restockProduct(
  productId: string, 
  quantity: number = 10
): Promise<Product> {
  const user = await getCurrentUser();

  const updatedProduct = await prisma.product.update({
    where: { 
      id: productId,
      clinicId: user.role !== 'SUPER_ADMIN' ? user.clinicId : undefined
    },
    data: { 
      stock: { increment: quantity },
      updatedAt: new Date()
    },
    include: {
      clinic: user.role === 'SUPER_ADMIN' ? { select: { name: true } } : false
    }
  });

  revalidatePath('/products');
  return updatedProduct; // Retourne le produit réapprovisionné
}

// Mettre à jour un produit
export async function updateProduct(
  productId: string, 
  data: Partial<{
    name: string;
    description: string;
    price: number;
    stock: number;
  }>
) {
  const user = await getCurrentUser();

  // Vérifier l'unicité du nom si modification
  if (data.name) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: data.name,
        clinicId: user.clinicId!,
        NOT: { id: productId }
      }
    });

    if (existingProduct) {
      throw new Error('Un produit avec ce nom existe déjà dans votre clinique');
    }
  }

  await prisma.product.update({
    where: { 
      id: productId,
      clinicId: user.role !== 'SUPER_ADMIN' ? user.clinicId : undefined
    },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });

  revalidatePath('/products');
  redirect('/products');
}

// Supprimer un produit
export async function deleteProduct(productId: string) {
  const user = await getCurrentUser();

  await prisma.product.delete({
    where: { 
      id: productId,
      clinicId: user.role !== 'SUPER_ADMIN' ? user.clinicId : undefined
    }
  });

  revalidatePath('/products');
  redirect('/products');
}