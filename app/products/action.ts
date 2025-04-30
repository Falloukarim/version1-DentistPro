'use server';

import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  used: number;
  updatedAt: Date;
}

export async function fetchProducts(): Promise<Product[] | null> {
    try {
      return await prisma.product.findMany({
        orderBy: { updatedAt: 'desc' }
      });
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  }

export async function addProduct(data: {
  name: string;
  price: number;
  stock: number;
  description?: string;
}) {
  await prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      stock: data.stock,
      description: data.description || null,
      used: 0
    }
  });
  revalidatePath('/products');
}

export async function useProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) throw new Error('Produit non trouvé');
  if (product.stock <= product.used) throw new Error('Stock épuisé');

  await prisma.product.update({
    where: { id: productId },
    data: { used: { increment: 1 } }
  });
  revalidatePath('/products');
}

export async function restockProduct(productId: string, quantity: number = 10) {
  await prisma.product.update({
    where: { id: productId },
    data: { stock: { increment: quantity } }
  });
  revalidatePath('/products');
}