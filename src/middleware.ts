import { clerkMiddleware } from "@clerk/nextjs/server";

// By default, clerkMiddleware does not protect any routes.
// See https://clerk.com/docs/references/nextjs/clerk-middleware
// We handle route protection/redirection within the page components.
export default clerkMiddleware();

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: [ '/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}; 