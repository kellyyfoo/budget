import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')

  const requests = await prisma.friendship.findMany({
    where: { addresseeId: userId, status: 'pending' },
    include: {
      requester: { select: { id: true, name: true, username: true, avatar_url: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(
    requests.map((r) => ({ friendshipId: r.id, ...r.requester }))
  )
}
