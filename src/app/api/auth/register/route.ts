import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { signToken } from '@/lib/auth'
import { DEFAULT_CATEGORIES } from '@/types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { firstName, lastName, username, password } = body

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: 'First and last name are required' }, { status: 400 })
  }
  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
    return NextResponse.json({ error: 'Username must be 3–30 characters and contain only letters, numbers, underscores, or hyphens' }, { status: 400 })
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'That username is already taken' }, { status: 409 })
  }

  const password_hash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { username, password_hash, name: `${firstName.trim()} ${lastName.trim()}` },
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
