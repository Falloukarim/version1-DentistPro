import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Debug: Affiche les claims de session
  console.log('Session claims:', sessionClaims);

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|static|favicon.ico|api/auth).*)'],
};