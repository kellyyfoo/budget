import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')

  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'accepted',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  })

  const friendIds = friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId
  )

  if (friendIds.length === 0) return NextResponse.json([])

  const [expenses, recurringExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: { user_id: { in: friendIds } },
      orderBy: { created_at: 'desc' },
      take: 30,
      select: {
        id: true,
        user_id: true,
        amount: true,
        category: true,
        date: true,
        created_at: true,
        description: true,
        user: { select: { id: true, name: true, username: true, avatar_url: true } },
      },
    }),
    prisma.recurringExpense.findMany({
      where: { user_id: { in: friendIds } },
      select: { user_id: true, description: true, amount: true, category: true },
    }),
  ])

  const filtered = expenses.filter(
    (e) => !recurringExpenses.some(
      (r) => r.user_id === e.user_id && r.description === e.description && r.amount === e.amount && r.category === e.category
    )
  )

  return NextResponse.json(
    filtered.map((e) => ({
      id: e.id,
      friendId: e.user_id,
      friendName: e.user.name ?? e.user.username ?? 'Unknown',
      friendAvatarUrl: e.user.avatar_url,
      amount: e.amount,
      category: e.category,
      date: e.created_at.toISOString(),
    }))
  )
}
