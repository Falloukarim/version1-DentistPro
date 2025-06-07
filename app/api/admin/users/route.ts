import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Vérification renforcée
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true, clinicId: true }
    })

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Si ADMIN (non SUPER_ADMIN), ne retourne que les users de sa clinique
    const whereClause = currentUser.role === 'SUPER_ADMIN' 
      ? {}
      : { clinicId: currentUser.clinicId }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        clerkUserId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        clinic: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('[GET_USERS_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}