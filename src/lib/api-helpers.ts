// lib/api-helpers.ts
import { NextResponse } from 'next/server';

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
}

export function userNotFoundResponse() {
  return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
}

export function serverErrorResponse(error?: unknown) {
  const message = error instanceof Error ? error.message : 'Erreur serveur';
  return NextResponse.json({ error: message }, { status: 500 });
}

export function badRequestResponse(message?: string) {
  return NextResponse.json({ error: message || "Requête invalide" }, { status: 400 });
}

export function notFoundResponse() {
  return NextResponse.json({ error: "Ressource non trouvée" }, { status: 404 });
}
