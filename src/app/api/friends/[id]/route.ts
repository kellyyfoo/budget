import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const { id } = await params
  const friendshipId = parseInt(id)

  const friendship = await prisma.friendship.findFirst({
    where: {
      id: friendshipId,
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
  })
  if (!friendship) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.friendship.delete({ where: { id: friendshipId } })
  return NextResponse.json({ ok: true })
}
