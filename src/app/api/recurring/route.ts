import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function currentYearMonth() {
  const now = new Date()
  return { currentYear: now.getFullYear(), currentMonth: now.getMonth() + 1 }
}

function futureBudgetMonthFilter(userId: number) {
  const { currentYear, currentMonth } = currentYearMonth()
  return {
    user_id: userId,
    OR: [
      { year: { gt: currentYear } },
      { AND: [{ year: currentYear }, { month: { gte: currentMonth } }] },
    ],
  }
}

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')

  const [user, items] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { default_net_income: true, default_rent: true, default_savings_goal: true },
    }),
    prisma.recurringExpense.findMany({
      where: { user_id: userId },
      orderBy: { sort_order: 'asc' },
    }),
  ])

  return NextResponse.json({
    net_income: user?.default_net_income ?? 0,
    rent: user?.default_rent ?? 0,
    savings_goal: user?.default_savings_goal ?? 0,
    items,
  })
}

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const body = await request.json()
  const { net_income, rent, savings_goal } = body

  const updateData = {
    ...(net_income !== undefined && { net_income: parseFloat(net_income) }),
    ...(rent !== undefined && { rent: parseFloat(rent) }),
    ...(savings_goal !== undefined && { savings_goal: parseFloat(savings_goal) }),
  }

  const [user] = await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: {
        ...(net_income !== undefined && { default_net_income: parseFloat(net_income) }),
        ...(rent !== undefined && { default_rent: parseFloat(rent) }),
        ...(savings_goal !== undefined && { default_savings_goal: parseFloat(savings_goal) }),
      },
      select: { default_net_income: true, default_rent: true, default_savings_goal: true },
    }),
    prisma.budgetMonth.updateMany({
      where: futureBudgetMonthFilter(userId),
      data: updateData,
    }),
  ])

  // Sync any missing recurring items into all existing future BudgetMonths
  const [futureBudgetMonths, recurringItems] = await Promise.all([
    prisma.budgetMonth.findMany({
      where: futureBudgetMonthFilter(userId),
      select: { id: true, year: true, month: true },
    }),
    prisma.recurringExpense.findMany({ where: { user_id: userId } }),
  ])
  if (futureBudgetMonths.length > 0 && recurringItems.length > 0) {
    const bmIds = futureBudgetMonths.map((bm) => bm.id)
    const existingExpenses = await prisma.expense.findMany({
      where: { budget_month_id: { in: bmIds } },
      select: { budget_month_id: true, description: true, category: true },
    })
    const toCreate = futureBudgetMonths.flatMap((bm) => {
      const bmExpenses = existingExpenses.filter((e) => e.budget_month_id === bm.id)
      return recurringItems
        .filter((re) => !bmExpenses.some((e) => e.description === re.description && e.category === re.category))
        .map((re) => ({
          user_id: userId,
          budget_month_id: bm.id,
          description: re.description,
          amount: re.amount,
          date: new Date(Date.UTC(bm.year, bm.month - 1, 1)),
          category: re.category,
        }))
    })
    if (toCreate.length > 0) await prisma.expense.createMany({ data: toCreate })
  }

  return NextResponse.json({
    net_income: user.default_net_income,
    rent: user.default_rent,
    savings_goal: user.default_savings_goal,
  })
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const body = await request.json()
  const { description, amount, category } = body

  if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  if (amount === undefined || amount === '') return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
  if (!category) return NextResponse.json({ error: 'Category is required' }, { status: 400 })

  const validCategory = await prisma.userCategory.findUnique({
    where: { user_id_slug: { user_id: userId, slug: category } },
  })
  if (!validCategory) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })

  const count = await prisma.recurringExpense.count({ where: { user_id: userId } })
  const item = await prisma.recurringExpense.create({
    data: {
      user_id: userId,
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      sort_order: count,
    },
  })

  const futureBudgetMonths = await prisma.budgetMonth.findMany({
    where: futureBudgetMonthFilter(userId),
    select: { id: true, year: true, month: true },
  })

  if (futureBudgetMonths.length > 0) {
    await prisma.expense.createMany({
      data: futureBudgetMonths.map((bm) => ({
        user_id: userId,
        budget_month_id: bm.id,
        description: item.description,
        amount: item.amount,
        date: new Date(Date.UTC(bm.year, bm.month - 1, 1)),
        category: item.category,
      })),
    })
  }

  return NextResponse.json(item, { status: 201 })
}
