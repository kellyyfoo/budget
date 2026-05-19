import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const profileSelect = { id: true, name: true, avatar_url: true, email: true, phone: true, username: true } as const

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const user = await prisma.user.findUnique({ where: { id: userId }, select: profileSelect })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const body = await request.json()
  const { name, username } = body

  if (username !== undefined && username !== null && username !== '') {
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      return NextResponse.json({ error: 'Username must be 3–30 characters and contain only letters, numbers, underscores, or hyphens' }, { status: 400 })
    }
    const conflict = await prisma.user.findFirst({ where: { username, NOT: { id: userId } } })
    if (conflict) {
      return NextResponse.json({ error: 'That username is already taken' }, { status: 409 })
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name: name?.trim() || null }),
      ...(username !== undefined && { username: username?.trim() || null }),
    },
    select: profileSelect,
  })
  return NextResponse.json(user)
}
