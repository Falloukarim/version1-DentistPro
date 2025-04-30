// clerk.config.ts
import type { ClerkMiddlewareAuth } from "@clerk/nextjs/server";

export const clerkMiddlewareConfig = {
  publicRoutes: ["/", "/sign-in(.*)", "/sign-up(.*)"],

  afterAuth(auth: ClerkMiddlewareAuth, req: Request) {
    console.log("Clerk middleware executed 🚀");

    // Exemple : si l'utilisateur n'est pas connecté, tu peux rediriger ici manuellement
    // if (!auth.userId) {
    //   return NextResponse.redirect("/sign-in");
    // }
  },
};
