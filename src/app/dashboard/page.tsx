import { redirect } from 'next/navigation'
import { getSession } from '@/lib/getSession'
import { prisma } from '@/lib/prisma'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { Expense, BudgetMonthData, UserCategory, UserProfile, RecurringExpense } from '@/types'
import { DEFAULT_CATEGORIES } from '@/types'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  let budgetMonth = await prisma.budgetMonth.findUnique({
    where: { user_id_year_month: { user_id: session.userId, year, month } },
  })

  const userRecord = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      avatar_url: true,
      email: true,
      phone: true,
      default_net_income: true,
      default_rent: true,
      default_savings_goal: true,
    },
  })

  if (!budgetMonth) {
    const recurringItems = await prisma.recurringExpense.findMany({
      where: { user_id: session.userId },
      orderBy: { sort_order: 'asc' },
    })

    budgetMonth = await prisma.budgetMonth.create({
      data: {
        user_id: session.userId,
        year,
        month,
        net_income: userRecord?.default_net_income ?? 0,
        rent: userRecord?.default_rent ?? 0,
        savings_goal: userRecord?.default_savings_goal ?? 0,
      },
    })

    if (recurringItems.length > 0) {
      const date = new Date(Date.UTC(year, month - 1, 1))
      await prisma.expense.createMany({
        data: recurringItems.map((re) => ({
          user_id: session.userId,
          budget_month_id: budgetMonth!.id,
          description: re.description,
          amount: re.amount,
          date,
          category: re.category,
        })),
      })
    }
  }

  const expenseRecords = await prisma.expense.findMany({
    where: { budget_month_id: budgetMonth.id, user_id: session.userId },
    orderBy: { date: 'desc' },
  })

  const initialBudget: BudgetMonthData = {
    id: budgetMonth.id,
    year,
    month,
    net_income: budgetMonth.net_income,
    rent: budgetMonth.rent,
    savings_goal: budgetMonth.savings_goal,
  }

  const initialExpenses: Expense[] = expenseRecords.map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    date: e.date.toISOString(),
    category: e.category as Expense['category'],
    created_at: e.created_at.toISOString(),
  }))

  let categories = await prisma.userCategory.findMany({
    where: { user_id: session.userId },
    orderBy: { sort_order: 'asc' },
  })
  if (categories.length === 0) {
    await prisma.userCategory.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: session.userId })),
    })
    categories = await prisma.userCategory.findMany({
      where: { user_id: session.userId },
      orderBy: { sort_order: 'asc' },
    })
  }

  const recurringExpenses = await prisma.recurringExpense.findMany({
    where: { user_id: session.userId },
    orderBy: { sort_order: 'asc' },
  })

  const initialCategories: UserCategory[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    color: c.color,
    sort_order: c.sort_order,
  }))

  const initialProfile: UserProfile | null = userRecord
    ? {
        id: userRecord.id,
        name: userRecord.name,
        avatar_url: userRecord.avatar_url,
        email: userRecord.email,
        phone: userRecord.phone,
        default_net_income: userRecord.default_net_income,
        default_rent: userRecord.default_rent,
        default_savings_goal: userRecord.default_savings_goal,
      }
    : null

  const initialRecurring: RecurringExpense[] = recurringExpenses.map((re) => ({
    id: re.id,
    description: re.description,
    amount: re.amount,
    category: re.category,
    sort_order: re.sort_order,
  }))

  return (
    <DashboardClient
      initialBudget={initialBudget}
      initialExpenses={initialExpenses}
      initialYear={year}
      initialMonth={month}
      initialCategories={initialCategories}
      initialProfile={initialProfile}
      initialRecurring={initialRecurring}
    />
  )
}
