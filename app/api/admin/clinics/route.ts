import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import {
  badRequestResponse,
  forbiddenResponse,
  unauthorizedResponse,
  serverErrorResponse
} from '@/lib/api-helpers';
import { addDays } from 'date-fns'; 

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorizedResponse();

    const { name, address, phone, email }: {
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
    } = await req.json();

    if (!name?.trim()) return badRequestResponse("Le nom de la clinique est requis");
    if (!email?.trim()) return badRequestResponse("L'email est requis");

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return forbiddenResponse();
    }

    const newClinic = await prisma.clinic.create({
      data: {
        name: name.trim(),
        address: address?.trim() || "",
        phone: phone?.trim() || "",
        email: email.trim(),
        isActive: true,
        subscription: {
          create: {
            status: "trial",
            trialEndsAt: addDays(new Date(), 30),
            endDate: addDays(new Date(), 30), // utile pour respecter le schéma existant
          },
        },
      },
    });

    return NextResponse.json(newClinic, { status: 201 });
  } catch (error: unknown) {
    console.error("Error in POST /admin/clinics:", error);
    return serverErrorResponse(error);
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return forbiddenResponse();
    }

    const clinics = await prisma.clinic.findMany({
      where: { isActive: true }
    });

    return NextResponse.json(clinics, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in GET /admin/clinics:", error);
    return serverErrorResponse(error);
  }
}
