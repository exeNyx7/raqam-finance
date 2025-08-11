import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // This is a simple middleware example
  // In a real app, you'd check for valid auth tokens here

  const { pathname } = request.nextUrl

  // Allow auth pages
  if (pathname.startsWith("/auth")) {
    return NextResponse.next()
  }

  // For now, just allow all requests
  // In production, implement proper auth checking
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
