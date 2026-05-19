import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const { id } = await params
  const friendshipId = parseInt(id)

  const friendship = await prisma.friendship.findFirst({
    where: { id: friendshipId, addresseeId: userId, status: 'pending' },
  })
  if (!friendship) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.friendship.update({ where: { id: friendshipId }, data: { status: 'accepted' } })
  return NextResponse.json({ ok: true })
}
