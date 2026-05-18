import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function futureBudgetMonthFilter(userId: number) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  return {
    user_id: userId,
    OR: [
      { year: { gt: currentYear } },
      { AND: [{ year: currentYear }, { month: { gte: currentMonth } }] },
    ],
  }
}

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

  // Propagate changes to all future months' expense records
  const futureBudgetMonths = await prisma.budgetMonth.findMany({
    where: futureBudgetMonthFilter(userId),
    select: { id: true, year: true, month: true },
  })

  if (futureBudgetMonths.length > 0) {
    const bmIds = futureBudgetMonths.map((bm) => bm.id)
    const updatedDesc = description !== undefined ? description.trim() : existing.description
    const updatedCategory = category !== undefined ? category : existing.category
    const updatedAmount = amount !== undefined ? parseFloat(amount) : existing.amount

    // Update existing expense rows that match the old description + category
    await prisma.expense.updateMany({
      where: {
        budget_month_id: { in: bmIds },
        user_id: userId,
        description: existing.description,
        category: existing.category,
      },
      data: {
        description: updatedDesc,
        amount: updatedAmount,
        category: updatedCategory,
      },
    })

    // Create the expense in any future month that was missing it entirely
    const presentInMonths = await prisma.expense.findMany({
      where: {
        budget_month_id: { in: bmIds },
        user_id: userId,
        description: updatedDesc,
        category: updatedCategory,
      },
      select: { budget_month_id: true },
    })
    const coveredIds = new Set(presentInMonths.map((e) => e.budget_month_id))
    const toCreate = futureBudgetMonths
      .filter((bm) => !coveredIds.has(bm.id))
      .map((bm) => ({
        user_id: userId,
        budget_month_id: bm.id,
        description: updatedDesc,
        amount: updatedAmount,
        date: new Date(Date.UTC(bm.year, bm.month - 1, 1)),
        category: updatedCategory,
      }))
    if (toCreate.length > 0) await prisma.expense.createMany({ data: toCreate })
  }

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
