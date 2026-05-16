import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { COLOR_KEYS } from '@/lib/categoryColors'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const { id } = await params
  const catId = parseInt(id)

  const existing = await prisma.userCategory.findUnique({ where: { id: catId } })
  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const { name, color } = body

  if (color && !COLOR_KEYS.includes(color)) {
    return NextResponse.json({ error: 'Invalid color' }, { status: 400 })
  }

  const category = await prisma.userCategory.update({
    where: { id: catId },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(color && { color }),
    },
  })
  return NextResponse.json(category)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const { id } = await params
  const catId = parseInt(id)

  const existing = await prisma.userCategory.findUnique({ where: { id: catId } })
  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const expenseCount = await prisma.expense.count({
    where: { user_id: userId, category: existing.slug },
  })
  if (expenseCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${expenseCount} expense${expenseCount === 1 ? '' : 's'} use this category` },
      { status: 409 }
    )
  }

  await prisma.userCategory.delete({ where: { id: catId } })
  return new NextResponse(null, { status: 204 })
}
