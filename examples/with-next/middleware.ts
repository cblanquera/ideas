import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
 
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  if (url.searchParams.has('theme')) {
    const theme = url.searchParams.get('theme');
    if (theme) {
      request.nextUrl.searchParams.delete('theme');
      const response = NextResponse.redirect(url);
      response.cookies.set('theme', theme);
      return response;
    }
  }

  //if auth page allow
  if (url.pathname.startsWith('/auth/')) {
    return NextResponse.next();
  //if session exists allow
  } else if (request.cookies.get('session')?.value?.length) {
    return NextResponse.next();
  }

  NextResponse.redirect(new URL('/auth/signin', request.url))
}