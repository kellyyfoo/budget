import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const { searchParams } = new URL(request.url)
  const now = new Date()
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1))

  let budgetMonth = await prisma.budgetMonth.findUnique({
    where: { user_id_year_month: { user_id: userId, year, month } },
  })

  if (!budgetMonth && userId > 0) {
    const [user, recurringItems] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { default_net_income: true, default_rent: true, default_savings_goal: true },
      }),
      prisma.recurringExpense.findMany({ where: { user_id: userId }, orderBy: { sort_order: 'asc' } }),
    ])

    budgetMonth = await prisma.budgetMonth.create({
      data: {
        user_id: userId,
        year,
        month,
        net_income: user?.default_net_income ?? 0,
        rent: user?.default_rent ?? 0,
        savings_goal: user?.default_savings_goal ?? 0,
      },
    })

    if (recurringItems.length > 0) {
      const date = new Date(Date.UTC(year, month - 1, 1))
      await prisma.expense.createMany({
        data: recurringItems.map((re) => ({
          user_id: userId,
          budget_month_id: budgetMonth!.id,
          description: re.description,
          amount: re.amount,
          date,
          category: re.category,
        })),
      })
    }
  }

  return NextResponse.json(
    budgetMonth ?? { year, month, net_income: 0, rent: 0, savings_goal: 0 }
  )
}

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const body = await request.json()
  const { year, month, net_income, rent, savings_goal } = body

  const budgetMonth = await prisma.budgetMonth.upsert({
    where: { user_id_year_month: { user_id: userId, year, month } },
    create: { user_id: userId, year, month, net_income: net_income ?? 0, rent: rent ?? 0, savings_goal: savings_goal ?? 0 },
    update: {
      ...(net_income !== undefined && { net_income }),
      ...(rent !== undefined && { rent }),
      ...(savings_goal !== undefined && { savings_goal }),
    },
  })

  return NextResponse.json(budgetMonth)
}
