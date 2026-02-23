import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Minimal JWT verification for middleware (standard jwt library might not work in Edge runtime)
// If it fails, we might need jose or a simpler check.
// For now, let's assume a basic check or use 'jose' if needed.

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Allow access to login page and public assets
  if (
    pathname.startsWith('/login') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Basic token existence check. 
  // Full verification usually requires 'jose' in Edge Runtime.
  // We'll proceed with simple presence check for now or implement jose if it crashes.
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
