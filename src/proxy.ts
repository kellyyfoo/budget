import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PROTECTED_PAGES = ['/dashboard']
const PROTECTED_API = ['/api/budget', '/api/expenses', '/api/categories', '/api/profile', '/api/recurring']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p))
  const isProtectedApi = PROTECTED_API.some((p) => pathname.startsWith(p))

  if (!isProtectedPage && !isProtectedApi) return NextResponse.next()

  const token = request.cookies.get('token')?.value
  const session = token ? await verifyToken(token) : null

  if (!session) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const response = NextResponse.next()
  response.headers.set('x-user-id', String(session.userId))
  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/budget/:path*', '/api/expenses/:path*', '/api/categories/:path*', '/api/profile/:path*', '/api/recurring/:path*'],
}
