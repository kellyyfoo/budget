import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { emailOrPhone, otp, newPassword } = body

  if (!emailOrPhone || !otp || !newPassword) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
  })
  if (!user) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })

  const reset = await prisma.passwordReset.findFirst({
    where: {
      user_id: user.id,
      otp,
      used: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { id: 'desc' },
  })
  if (!reset) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })

  const password_hash = await hashPassword(newPassword)
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password_hash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
  ])

  const token = await signToken({ userId: user.id })
  const response = NextResponse.json({ ok: true })
  response.cookies.set('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
