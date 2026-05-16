import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const { id } = await params
  const expenseId = parseInt(id)

  const existing = await prisma.expense.findUnique({ where: { id: expenseId } })
  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const { description, amount, date, category } = body

  if (category) {
    const validCategory = await prisma.userCategory.findUnique({
      where: { user_id_slug: { user_id: userId, slug: category } },
    })
    if (!validCategory) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      ...(description !== undefined && { description }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(category !== undefined && { category }),
    },
  })

  return NextResponse.json(
    { ...expense, date: expense.date.toISOString(), created_at: expense.created_at.toISOString() }
  )
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const { id } = await params
  const expenseId = parseInt(id)

  const existing = await prisma.expense.findUnique({ where: { id: expenseId } })
  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.expense.delete({ where: { id: expenseId } })
  return new NextResponse(null, { status: 204 })
}
