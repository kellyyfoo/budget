import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const { id } = await params
  const itemId = parseInt(id)

  const existing = await prisma.recurringExpense.findUnique({ where: { id: itemId } })
  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const { description, amount, category } = body

  if (category) {
    const validCategory = await prisma.userCategory.findUnique({
      where: { user_id_slug: { user_id: userId, slug: category } },
    })
    if (!validCategory) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const item = await prisma.recurringExpense.update({
    where: { id: itemId },
    data: {
      ...(description !== undefined && { description: description.trim() }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(category !== undefined && { category }),
    },
  })

  return NextResponse.json(item)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const { id } = await params
  const itemId = parseInt(id)

  const existing = await prisma.recurringExpense.findUnique({ where: { id: itemId } })
  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.recurringExpense.delete({ where: { id: itemId } })
  return new NextResponse(null, { status: 204 })
}
