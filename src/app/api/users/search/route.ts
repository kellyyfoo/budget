import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get('x-user-id') ?? '0')
    const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''

    if (q.length < 2) return NextResponse.json([])

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { username: { contains: q } },
        ],
      },
      select: { id: true, name: true, username: true, avatar_url: true },
      take: 10,
    })

    let friendships: Array<{ id: number; requesterId: number; addresseeId: number; status: string }> = []
    try {
      friendships = await prisma.friendship.findMany({
        where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
        select: { id: true, requesterId: true, addresseeId: true, status: true },
      })
    } catch {
      // friendship model not yet in client cache — relation skipped
    }

    const results = users.map((u) => {
      const fs = friendships.find(
        (f) => f.requesterId === u.id || f.addresseeId === u.id
      )
      let relation: 'none' | 'friends' | 'sent' | 'received' = 'none'
      if (fs) {
        if (fs.status === 'accepted') relation = 'friends'
        else if (fs.requesterId === userId) relation = 'sent'
        else relation = 'received'
      }
      return { ...u, relation, friendshipId: fs?.id ?? null }
    })

    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
