import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const role = request.cookies.get('role')?.value as 'admin' | 'client' | undefined;

  if (request.nextUrl.pathname.startsWith('/dashboard/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard/client', request.url));
  }

  if (request.nextUrl.pathname.startsWith('/dashboard/client') && !role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };
