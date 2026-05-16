import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const { searchParams } = new URL(request.url)
  const now = new Date()
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1))

  const budgetMonth = await prisma.budgetMonth.findUnique({
    where: { user_id_year_month: { user_id: userId, year, month } },
  })

  if (!budgetMonth) return NextResponse.json([])

  const expenses = await prisma.expense.findMany({
    where: { budget_month_id: budgetMonth.id, user_id: userId },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(
    expenses.map((e) => ({ ...e, date: e.date.toISOString(), created_at: e.created_at.toISOString() }))
  )
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const body = await request.json()
  const { description, amount, date, category, year, month } = body

  if (!description || !amount || !date || !category) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const validCategory = await prisma.userCategory.findUnique({
    where: { user_id_slug: { user_id: userId, slug: category } },
  })
  if (!validCategory) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })

  const budgetMonth = await prisma.budgetMonth.upsert({
    where: { user_id_year_month: { user_id: userId, year, month } },
    create: { user_id: userId, year, month, net_income: 0, rent: 0 },
    update: {},
  })

  const expense = await prisma.expense.create({
    data: {
      user_id: userId,
      budget_month_id: budgetMonth.id,
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      category,
    },
  })

  return NextResponse.json(
    { ...expense, date: expense.date.toISOString(), created_at: expense.created_at.toISOString() },
    { status: 201 }
  )
}
