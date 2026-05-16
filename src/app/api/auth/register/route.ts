import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { signToken } from '@/lib/auth'
import { DEFAULT_CATEGORIES } from '@/types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, phone, password } = body

  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (!email && !phone) {
    return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 })
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }
  if (phone && !/^\+?[\d\s\-().]{7,}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [email ? { email } : {}, phone ? { phone } : {}].filter((c) => Object.keys(c).length > 0) },
  })
  if (existing) {
    return NextResponse.json({ error: 'An account with that email or phone already exists' }, { status: 409 })
  }

  const password_hash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email: email || null, phone: phone || null, password_hash },
  })

  await prisma.userCategory.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: user.id })),
  })

  const token = await signToken({ userId: user.id })
  const response = NextResponse.json({ userId: user.id }, { status: 201 })
  response.cookies.set('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
