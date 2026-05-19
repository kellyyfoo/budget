import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const friendSelect = { id: true, name: true, username: true, avatar_url: true } as const

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')

  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'accepted',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { select: friendSelect },
      addressee: { select: friendSelect },
    },
  })

  const friends = friendships.map((f) =>
    f.requesterId === userId ? { friendshipId: f.id, ...f.addressee } : { friendshipId: f.id, ...f.requester }
  )

  return NextResponse.json(friends)
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const { username } = await request.json()

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { username } })
  if (!target) {
    return NextResponse.json({ error: 'No user found with that username' }, { status: 404 })
  }
  if (target.id === userId) {
    return NextResponse.json({ error: 'You cannot add yourself' }, { status: 400 })
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: target.id },
        { requesterId: target.id, addresseeId: userId },
      ],
    },
  })
  if (existing) {
    const msg = existing.status === 'accepted' ? 'Already friends' : 'Friend request already sent or pending'
    return NextResponse.json({ error: msg }, { status: 409 })
  }

  await prisma.friendship.create({ data: { requesterId: userId, addresseeId: target.id } })
  return NextResponse.json({ ok: true }, { status: 201 })
}
