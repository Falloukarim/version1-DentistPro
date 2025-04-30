// app/api/add-dentist/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(req: Request) {
  const { firstName, lastName, email, clerkUserId } = await req.json();

  // Validation basique
  if (!firstName || !email || !clerkUserId) {
    return NextResponse.json(
      { error: "Champs requis manquants" },
      { status: 400 }
    );
  }

  try {
    const dentist = await prisma.user.create({
      data: {
        clerkUserId,
        firstName,
        lastName: lastName || "",
        email,
        role: 'DENTIST',
        isActive: true
      }
    });

    return NextResponse.json(dentist);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la création" },
      { status: 500 }
    );
  }
}