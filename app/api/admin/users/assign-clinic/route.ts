import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Vérification des permissions
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { clerkUserId, clinicId } = await req.json()

    if (!clerkUserId || !clinicId) {
      return NextResponse.json(
        { error: 'clerkUserId and clinicId are required' },
        { status: 400 }
      )
    }

    // Assigner l'utilisateur à la clinique
    const updatedUser = await prisma.user.update({
      where: { clerkUserId },
      data: { clinicId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        clinic: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        clinic: updatedUser.clinic?.name
      }
    })
  } catch (error) {
    console.error('[ASSIGN_CLINIC_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}