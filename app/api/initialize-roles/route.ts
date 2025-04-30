// app/api/initialize-roles/route.ts
import { initializeRoles } from '../../actions/initialize-roles';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await initializeRoles();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}