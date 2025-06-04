export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse
} from '@/lib/api-helpers';

// GET /api/clinics/[id]
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const { userId } = getAuth(request);
    if (!userId) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true, clinicId: true }
    });

    if (!user) return unauthorizedResponse();

    if (user.role !== 'SUPER_ADMIN' && user.clinicId !== id) {
      return forbiddenResponse();
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        isActive: true
      }
    });

    if (!clinic) return notFoundResponse();

    return NextResponse.json(clinic);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// PATCH /api/clinics/[id]
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const { userId } = getAuth(request);
    if (!userId) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true, clinicId: true }
    });

    if (!user) return unauthorizedResponse();

    if (user.role !== 'SUPER_ADMIN' && user.clinicId !== id) {
      return forbiddenResponse();
    }

    const body = await request.json();

    if (body.name && typeof body.name !== 'string') {
      return badRequestResponse('Nom invalide');
    }

    const updatedClinic = await prisma.clinic.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true
      }
    });

    return NextResponse.json(updatedClinic);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// DELETE /api/clinics/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const { userId } = getAuth(request);
    if (!userId) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') return forbiddenResponse();

    const clinic = await prisma.clinic.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true }
    });

    return NextResponse.json({
      success: true,
      message: `Clinique ${clinic.name} désactivée`
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
