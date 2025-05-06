import { auth } from "@clerk/nextjs/server";
import prisma from "./prisma";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const { userId } = await  auth();
  
  if (!userId) return null;

  return await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      clinic: true
    }
  });
}

export async function checkUserRole(allowedRoles: string[]) {
  const user = await getCurrentUser();
  
  if (!user || !allowedRoles.includes(user.role)) {
    redirect('/unauthorized');
  }

  return user;
}

export async function getCurrentClinic() {
  const user = await getCurrentUser();
  
  if (!user?.clinicId) {
    throw new Error("Aucune clinique assignée");
  }

  return user.clinic;
}