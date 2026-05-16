import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword } from '@/lib/password'
import { signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { emailOrPhone, password } = body

  if (!emailOrPhone || !password) {
    return NextResponse.json({ error: 'Email/phone and password are required' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
  })

  if (!user || !(await comparePassword(password, user.password_hash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signToken({ userId: user.id })
  const response = NextResponse.json({ userId: user.id })
  response.cookies.set('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
